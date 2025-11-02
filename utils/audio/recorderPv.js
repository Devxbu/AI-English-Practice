const { PvRecorder } = require('@picovoice/pvrecorder-node');
const wav = require('wav');

class PvRecorderDriver {
  constructor({ deviceIndex, sampleRate = 16000, frameLength = 512 } = {}) {
    this.deviceIndex = deviceIndex;
    this.sampleRate = sampleRate;
    this.frameLength = frameLength;
  }

  async record(outputFile, { onKeypress } = {}) {
    const recorder = new PvRecorder(this.frameLength, this.deviceIndex);
    const fileWriter = new wav.FileWriter(outputFile, {
      sampleRate: this.sampleRate,
      channels: 1,
      bitDepth: 16,
    });

    let run = true;
    const onData = (key) => {
      if (onKeypress) onKeypress(key);
      if (key === 'q') {
        run = false;
      }
    };
    process.stdin.on('data', onData);

    try {
      recorder.start();
      while (run) {
        const pcm = await recorder.read();
        const buffer = Buffer.alloc(pcm.length * 2);
        for (let i = 0; i < pcm.length; i++) buffer.writeInt16LE(pcm[i], i * 2);
        fileWriter.write(buffer);
      }
    } finally {
      try { recorder.stop(); } catch {}
      try { recorder.release(); } catch {}
      try { fileWriter.end(); } catch {}
      process.stdin.removeListener('data', onData);
    }
    return outputFile;
  }
}

module.exports = { PvRecorderDriver };
