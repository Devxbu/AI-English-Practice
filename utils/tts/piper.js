const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function stripSsml(input) {
  return String(input)
    .replace(/<[^>]+>/g, ' ') // remove tags
    .replace(/\s+/g, ' ')    // collapse whitespace
    .trim();
}

function emotionToPiperParams(emotion, base = {}) {
  // Map emotion to piper synthesis params
  // length_scale: >1 slower, <1 faster
  // noise_scale and noise_w help expressiveness depending on model
  const e = (emotion || '').toLowerCase();
  const out = { ...base };
  switch (e) {
    case 'excited':
      out.length = out.length ?? 0.9;
      out.noise = out.noise ?? 0.7;
      out.noiseW = out.noiseW ?? 0.9;
      break;
    case 'happy':
      out.length = out.length ?? 0.95;
      out.noise = out.noise ?? 0.6;
      out.noiseW = out.noiseW ?? 0.8;
      break;
    case 'sad':
      out.length = out.length ?? 1.15;
      out.noise = out.noise ?? 0.5;
      out.noiseW = out.noiseW ?? 0.7;
      break;
    case 'calm':
      out.length = out.length ?? 1.05;
      out.noise = out.noise ?? 0.55;
      out.noiseW = out.noiseW ?? 0.75;
      break;
    default:
      out.length = out.length ?? 1.0;
      // leave noise undefined to use model defaults
  }
  return out;
}

function synthesizeWithPiper({ bin, text, outputPath, model, configPath, speaker, length, noise, noiseW }) {
  if (!model) throw new Error('Piper model file path is required (PIPER_MODEL or --piper-model).');
  return new Promise((resolve, reject) => {
    const args = ['-m', model, '-f', outputPath];
    if (configPath) { args.push('-c', configPath); }
    if (speaker) { args.push('-s', String(speaker)); }
    if (typeof length === 'number') { args.push('--length_scale', String(length)); }
    if (typeof noise === 'number') { args.push('--noise_scale', String(noise)); }
    if (typeof noiseW === 'number') { args.push('--noise_w', String(noiseW)); }

    const proc = spawn(bin || 'piper', args, { stdio: ['pipe', 'inherit', 'inherit'] });
    proc.on('error', reject);
    proc.on('exit', (code) => {
      if (code === 0) return resolve(outputPath);
      reject(new Error(`piper exited with code ${code}`));
    });

    try {
      proc.stdin.write(text);
      proc.stdin.end();
    } catch (e) {
      try { proc.kill(); } catch {}
      reject(e);
    }
  });
}

function createPiperProvider(cfg) {
  return {
    async synthesize(input, outputPath, { emotion } = {}) {
      const plain = stripSsml(input);
      const params = emotionToPiperParams(emotion, {
        length: cfg.piperLength,
        noise: cfg.piperNoise,
        noiseW: cfg.piperNoiseW,
      });
      // Ensure output directory exists
      try { await fs.promises.mkdir(path.dirname(outputPath), { recursive: true }); } catch {}
      // Determine config path: explicit or adjacent .json next to model
      let configPath = cfg.piperConfig;
      if (!configPath && cfg.piperModel) {
        const candidate = cfg.piperModel.replace(/\.onnx$/i, '.onnx.json');
        try { if (fs.existsSync(candidate)) configPath = candidate; } catch {}
      }
      return await synthesizeWithPiper({
        bin: cfg.piperBin,
        text: plain,
        outputPath,
        model: cfg.piperModel,
        configPath,
        speaker: cfg.piperSpeaker,
        length: params.length,
        noise: params.noise,
        noiseW: params.noiseW,
      });
    }
  };
}

module.exports = { createPiperProvider };
