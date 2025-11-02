const textToSpeech = require("@google-cloud/text-to-speech");
const fs = require("fs");

module.exports.transformTextToSpeech = async (text, outputFilePath = "output.mp3", opts = {}) => {
  if (!text || !text.trim()) {
    throw new Error("Text input cannot be empty.");
  }

  const client = new textToSpeech.TextToSpeechClient();

  const isSsml = /^\s*<speak[>\s]/i.test(text);
  const input = isSsml ? { ssml: text } : { text };

  const voiceName = opts.voice || process.env.GOOGLE_VOICE || "en-US-Neural2-F";
  const speakingRate = typeof opts.rate === 'number' ? opts.rate : (process.env.GOOGLE_RATE ? Number(process.env.GOOGLE_RATE) : 1.05);
  const pitch = typeof opts.pitch === 'number' ? opts.pitch : (process.env.GOOGLE_PITCH ? Number(process.env.GOOGLE_PITCH) : -2.0);

  const req = {
    input,
    voice: {
      languageCode: "en-US",
      name: voiceName,
      ssmlGender: "FEMALE",
    },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate,
      pitch,
      effectsProfileId: [
        "headphone-class-device",
        "medium-bluetooth-speaker-class-device"
      ]
    },
  };

  const [res] = await client.synthesizeSpeech(req);
  fs.writeFileSync(outputFilePath, res.audioContent, "binary");
  console.log(`Audio saved as ${outputFilePath}`);
  return outputFilePath;
};
