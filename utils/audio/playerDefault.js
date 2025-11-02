const playerLib = require('play-sound');
const fs = require('fs');

class DefaultPlayer {
  constructor(options = {}) {
    this.player = playerLib(options);
    this._child = null;
  }

  play(filePath) {
    if (!fs.existsSync(filePath)) {
      return Promise.reject(new Error('File not found: ' + filePath));
    }
    return new Promise((resolve, reject) => {
      try {
        this._child = this.player.play(filePath, (err) => {
          this._child = null;
          if (err) return reject(err);
          return resolve();
        });
      } catch (err) {
        this._child = null;
        reject(err);
      }
    });
  }

  stop() {
    if (this._child && typeof this._child.kill === 'function') {
      try { this._child.kill(); } catch {}
      this._child = null;
    }
  }
}

module.exports = { DefaultPlayer };
