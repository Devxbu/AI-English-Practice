const fs = require('fs');
const path = require('path');

function nowIso() { return new Date().toISOString(); }

class SessionStore {
  constructor(rootDir, sessionId) {
    this.rootDir = rootDir;
    this.sessionId = sessionId;
    this.dir = path.join(rootDir, sessionId);
    this.file = path.join(this.dir, 'session.json');
    this.data = { sessionId, startedAt: nowIso(), meta: {}, turns: [] };
  }

  async init(meta = {}) {
    await fs.promises.mkdir(this.dir, { recursive: true });
    this.data.meta = meta;
    await this.save();
  }

  async save() {
    await fs.promises.writeFile(this.file, JSON.stringify(this.data, null, 2));
  }

  addTurn(turn) {
    this.data.turns.push({ ...turn, ts: nowIso() });
  }

  setSummary(summary) {
    this.data.summary = summary;
  }

  static async loadLatest(rootDir) {
    const entries = await fs.promises.readdir(rootDir).catch(() => []);
    const dirs = entries.filter((d) => !d.startsWith('.'));
    const withTimes = await Promise.all(dirs.map(async (d) => {
      const p = path.join(rootDir, d, 'session.json');
      try { const s = await fs.promises.stat(p); return { d, t: s.mtimeMs }; } catch { return null; }
    }));
    const filtered = withTimes.filter(Boolean).sort((a, b) => b.t - a.t);
    if (!filtered.length) return null;
    const latestPath = path.join(rootDir, filtered[0].d, 'session.json');
    const raw = await fs.promises.readFile(latestPath, 'utf8');
    return JSON.parse(raw);
  }
}

function extractVocab(text) {
  if (!text) return [];
  const stop = new Set(['the','a','an','and','or','but','so','to','of','in','on','at','for','from','by','is','are','am','was','were','be','been','being','it','this','that','these','those','i','you','he','she','we','they','me','him','her','us','them','my','your','his','her','our','their','with','as','about','into','over','after','before','up','down']);
  return Array.from(new Set(
    text
      .toLowerCase()
      .replace(/[^a-z\s']/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stop.has(w))
  ));
}

async function exportVocabCsv(filePath, words) {
  const unique = Array.from(new Set(words));
  const lines = ['word'];
  for (const w of unique) lines.push(w);
  await fs.promises.writeFile(filePath, lines.join('\n'));
}

module.exports = { SessionStore, extractVocab, exportVocabCsv };
