const os = require('os');

function parseArgs(argv = process.argv.slice(2)) {
  const cfg = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const [key, rawVal] = arg.split('=');
    const k = key.replace(/^--/, '');
    const val = rawVal !== undefined ? rawVal : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true);
    cfg[k] = val;
  }
  return cfg;
}

function buildConfig() {
  const args = parseArgs();
  const platform = os.platform();

  const config = {
    platform,
    recorder: args.recorder || process.env.RECORDER || 'auto',
    player: args.player || process.env.PLAYER || 'default',
    deviceIndex: args['device-index'] !== undefined ? Number(args['device-index']) : (process.env.DEVICE_INDEX ? Number(process.env.DEVICE_INDEX) : undefined),
    sessionRoot: args['session-dir'] || process.env.SESSION_DIR || 'sessions',
    demo: args.demo === true || String(process.env.DEMO || '').toLowerCase() === 'true',
    aiProvider: args['ai-provider'] || process.env.AI_PROVIDER || 'groq',
    noOverlap: args['no-overlap'] === true || String(process.env.NO_OVERLAP || '').toLowerCase() === 'true',
    // Learning features
    scenario: args.scenario || process.env.SCENARIO || '',
    level: args.level || process.env.LEVEL || '',
    corrections: args.corrections || process.env.CORRECTIONS || 'off', // end-of-turn|inline|off
    pronunciationFeedback: args['pronunciation-feedback'] === true || String(process.env.PRONUNCIATION_FEEDBACK || '').toLowerCase() === 'true',
    exportVocab: args['export-vocab'] || process.env.EXPORT_VOCAB || '', // anki|csv|''
    listening: args.listening === true || String(process.env.LISTENING || '').toLowerCase() === 'true',
    topic: args.topic || process.env.TOPIC || '',
    minutes: args.minutes ? Number(args.minutes) : (process.env.MINUTES ? Number(process.env.MINUTES) : 2),
    continueSession: args.continue === true || String(process.env.CONTINUE || '').toLowerCase() === 'true',
    sourceWav: args['source-wav'] || process.env.DEMO_SOURCE_WAV || '',
  };

  return config;
}

module.exports = { buildConfig };
