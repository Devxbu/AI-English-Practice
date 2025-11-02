const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const { buildConfig } = require('./config');
const { selectRecorder, selectPlayer, sessionFile } = require('./utils/audio');
const { transcribeAudio } = require('./utils/transcribeAudio');
const { transformTextToSpeech } = require('./utils/textToSpeech');
const { withRetry } = require('./utils/retry');
const { createGroqProvider } = require('./providers/ai/groqProvider');
const { SessionStore, extractVocab, exportVocabCsv } = require('./utils/sessionStore');

function newSessionId() {
  const t = new Date();
  return (
    t.toISOString().replace(/[-:.TZ]/g, '') + '-' + Math.random().toString(36).slice(2, 8)
  );
}

async function ensureDir(p) {
  await fs.promises.mkdir(p, { recursive: true });
}

async function main() {
  const config = buildConfig();
  process.stdin.setRawMode(true);
  process.stdin.setEncoding('utf8');
  process.stdin.resume();

  const sessionId = newSessionId();
  const sessionDir = path.join(config.sessionRoot, sessionId);
  await ensureDir(sessionDir);

  const recorder = selectRecorder(config);
  const player = selectPlayer(config);
  const ai = createGroqProvider({});

  // Load continuation defaults if requested
  let continueMeta = null;
  if (config.continueSession) {
    try { continueMeta = await SessionStore.loadLatest(config.sessionRoot); } catch {}
  }
  const meta = {
    scenario: config.scenario || continueMeta?.meta?.scenario || '',
    level: config.level || continueMeta?.meta?.level || '',
    listening: !!config.listening,
    topic: config.topic || continueMeta?.meta?.topic || '',
  };
  const store = new SessionStore(config.sessionRoot, sessionId);
  await store.init(meta);
  let vocabBag = [];

  const bus = new EventEmitter();

  // Global key handling: Ctrl+C to exit, 'n' to skip/stop playback
  process.stdin.on('data', (key) => {
    if (key === '\u0003') {
      console.log('Exiting...');
      try { player.stop(); } catch {}
      finalize().finally(() => process.exit());
    }
    if (key.toLowerCase() === 'n') {
      console.log('Skipping playback...');
      try { player.stop(); } catch {}
    }
  });

  bus.on('error', (e) => {
    console.error('Error:', e?.message || e);
  });

  async function finalize() {
    // Session summary and optional vocab export
    const turns = store.data.turns || [];
    const totalWords = turns.reduce((a, t) => a + (t.userWordCount || 0), 0);
    const avgConfidence = (() => {
      const vals = turns.map(t => t.sttConfidence).filter(v => typeof v === 'number');
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : undefined;
    })();
    store.setSummary({ totalTurns: turns.length, totalWords, avgConfidence });
    await store.save();
    if (config.exportVocab === 'csv') {
      const csvPath = path.join(sessionDir, 'vocab.csv');
      await exportVocabCsv(csvPath, vocabBag);
      console.log('Vocabulary exported to', csvPath);
    }
  }

  async function doListeningTurn(turnIdx) {
    const mp3Path = sessionFile(config, sessionId, `turn-${turnIdx}.mp3`);
    const speech = await withRetry(
      () => ai.monologue({ topic: meta.topic, minutes: config.minutes, level: meta.level }),
      { attempts: 2, baseDelayMs: 500 }
    );
    const audioPath = await withRetry(
      () => transformTextToSpeech(speech, mp3Path),
      { attempts: 3, baseDelayMs: 500, factor: 2 }
    );
    player.play(audioPath)
      .then(() => { try { if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath); } catch {} })
      .catch(() => { try { if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath); } catch {} });
    const aiWords = extractVocab(speech);
    vocabBag.push(...aiWords);
    store.addTurn({ mode: 'listening', ai: speech });
    await store.save();
  }

  async function runTurn(turnIdx) {
    const wavPath = sessionFile(config, sessionId, `turn-${turnIdx}.wav`);
    const mp3Path = sessionFile(config, sessionId, `turn-${turnIdx}.mp3`);

    console.log('\nSpeak now. Press q to end this turn.');
    await recorder.record(wavPath);
    bus.emit('recorded', wavPath);

    const stt = await withRetry(
      () => transcribeAudio(wavPath),
      { attempts: 3, baseDelayMs: 400, factor: 2, onError: (e, n) => console.warn(`STT attempt ${n} failed: ${e?.message || e}`) }
    );
    const transcript = typeof stt === 'string' ? stt : stt.transcript;
    bus.emit('transcribed', transcript);
    if (!transcript || transcript.trim() === '' || transcript === '[No speech detected]') {
      console.log('No speech detected, starting a new turn...');
      return;
    }

    const reply = await withRetry(
      () => ai.chat({ text: transcript, scenario: meta.scenario, level: meta.level }),
      { attempts: 3, baseDelayMs: 500, factor: 2, onError: (e, n) => console.warn(`AI attempt ${n} failed: ${e?.message || e}`) }
    );
    bus.emit('responded', reply);

    const audioPath = await withRetry(
      () => transformTextToSpeech(reply, mp3Path),
      { attempts: 3, baseDelayMs: 500, factor: 2, onError: (e, n) => console.warn(`TTS attempt ${n} failed: ${e?.message || e}`) }
    );
    bus.emit('ttsReady', audioPath);

    // Play without blocking the next turn
    player.play(audioPath)
      .then(() => {
        bus.emit('played', audioPath);
        try { if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath); } catch {}
      })
      .catch((err) => {
        bus.emit('error', err);
        try { if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath); } catch {}
      });

    // Optional corrections
    let corrections = '';
    if (config.corrections && config.corrections !== 'off') {
      try {
        corrections = await withRetry(
          () => ai.corrections({ transcript, scenario: meta.scenario, level: meta.level }),
          { attempts: 2, baseDelayMs: 400 }
        );
      } catch {}
    }

    // Pronunciation feedback (heuristic)
    const sttConfidence = typeof stt?.confidence === 'number' ? stt.confidence : undefined;
    const lowWords = Array.isArray(stt?.words) ? stt.words.filter(w => typeof w.confidence === 'number' && w.confidence < 0.85).map(w => w.word) : [];

    // Vocab
    const userWords = extractVocab(transcript);
    const aiWords = extractVocab(reply);
    vocabBag.push(...userWords, ...aiWords);

    // Persist turn
    store.addTurn({
      mode: 'dialog',
      transcript,
      sttConfidence,
      unclearWords: Array.from(new Set(lowWords)).slice(0, 15),
      ai: reply,
      corrections,
      userWordCount: userWords.length,
    });
    await store.save();
  }

  let turn = 1;
  while (true) {
    try {
      if (meta.listening) {
        await doListeningTurn(turn++);
      } else {
        await runTurn(turn++);
      }
    } catch (e) {
      bus.emit('error', e);
    }
  }
}

main();