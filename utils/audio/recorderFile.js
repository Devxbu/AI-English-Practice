const fs = require('fs');
const path = require('path');

class FileRecorderDriver {
  constructor({ sourceFile } = {}) {
    this.sourceFile = sourceFile || process.env.DEMO_SOURCE_WAV || '';
  }

  async record(outputFile) {
    if (!this.sourceFile || !fs.existsSync(this.sourceFile)) {
      throw new Error('FileRecorderDriver: source WAV not found. Set --source-wav or DEMO_SOURCE_WAV');
    }
    await fs.promises.mkdir(path.dirname(outputFile), { recursive: true });
    await fs.promises.copyFile(this.sourceFile, outputFile);
    return outputFile;
  }
}

module.exports = { FileRecorderDriver };
