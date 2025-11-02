const os = require('os');
const path = require('path');
const { PvRecorderDriver } = require('./recorderPv');
const { Lpcm16RecorderDriver } = require('./recorderLpcm16');
const { FileRecorderDriver } = require('./recorderFile');
const { DefaultPlayer } = require('./playerDefault');

function selectRecorder(config) {
  const platform = config.platform || os.platform();
  const kind = (config.recorder || 'auto').toLowerCase();

  if (kind === 'file' || config.demo) {
    return new FileRecorderDriver({ sourceFile: config.sourceWav });
  }
  if (kind === 'pvrecorder') {
    return new PvRecorderDriver({ deviceIndex: config.deviceIndex });
  }
  if (kind === 'lpcm16') {
    return new Lpcm16RecorderDriver({ deviceIndex: config.deviceIndex });
  }
  // auto
  if (platform === 'darwin' || platform === 'win32') {
    return new PvRecorderDriver({ deviceIndex: config.deviceIndex });
  }
  // linux fallback
  try {
    return new Lpcm16RecorderDriver({ deviceIndex: config.deviceIndex });
  } catch {
    return new PvRecorderDriver({ deviceIndex: config.deviceIndex });
  }
}

function selectPlayer(config) {
  // Future: allow choosing e.g. mpg123, afplay, etc.
  return new DefaultPlayer();
}

function sessionFile(config, sessionId, name) {
  return path.join(config.sessionRoot, sessionId, name);
}

module.exports = { selectRecorder, selectPlayer, sessionFile };
