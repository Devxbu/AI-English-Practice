const { createPiperProvider } = require('./piper');
const { transformTextToSpeech } = require('../textToSpeech');

function selectTTS(config) {
  const provider = (config.ttsProvider || 'google').toLowerCase();
  if (provider === 'piper') {
    const piper = createPiperProvider(config);
    return {
      name: 'piper',
      async synthesize(input, outPath, opts) {
        return await piper.synthesize(input, outPath, opts);
      },
    };
  }
  // default google
  return {
    name: 'google',
    async synthesize(input, outPath /* opts may include emotion */) {
      return await transformTextToSpeech(input, outPath, {
        voice: config.googleVoice,
        rate: config.googleRate,
        pitch: config.googlePitch,
      });
    },
  };
}

module.exports = { selectTTS };
