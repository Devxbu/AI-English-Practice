const fs = require('fs');
const wav = require('wav');
let record;
try {
  record = require('node-record-lpcm16');
} catch (e) {
  // optional dependency; handled at runtime
}

class Lpcm16RecorderDriver {
  constructor({ deviceIndex, sampleRate = 16000 } = {}) {
    this.deviceIndex = deviceIndex;
    this.sampleRate = sampleRate;
  }

  async record(outputFile, { onKeypress } = {}) {
    if (!record) throw new Error('node-record-lpcm16 not installed');
    const fileWriter = new wav.FileWriter(outputFile, {
      sampleRate: this.sampleRate,
      channels: 1,
      bitDepth: 16,
    });

    let run = true;
    const onData = (key) => {
      if (onKeypress) onKeypress(key);
      if (key === 'q') run = false;
    };
    process.stdin.on('data', onData);

    const rec = record.record({
      sampleRate: this.sampleRate,
      threshold: 0,
      verbose: false,
      device: this.deviceIndex !== undefined ? `plughw:${this.deviceIndex}` : undefined,
    });

    return new Promise((resolve, reject) => {
      rec.stream().on('error', (e) => {
        cleanup();
        reject(e);
      }).pipe(fileWriter);

      const check = () => {
        if (!run) {
          cleanup();
          resolve(outputFile);
        } else {
          setImmediate(check);
        }
      };
      check();

      function cleanup() {
        try { rec.stop(); } catch {}
        try { fileWriter.end(); } catch {}
        process.stdin.removeListener('data', onData);
      }
    });
  }
}

module.exports = { Lpcm16RecorderDriver };
