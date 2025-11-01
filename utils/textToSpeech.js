const textToSpeech = require("@google-cloud/text-to-speech");
const fs = require("fs");

module.exports.transformTextToSpeech = async (text, outputFilePath = "output.mp3") => {
  if (!text || !text.trim()) {
    throw new Error("Text input cannot be empty.");
  }

  const client = new textToSpeech.TextToSpeechClient();

  const req = {
    input: { text },
    voice: {
      languageCode: "en-US",
      ssmlGender: "NEUTRAL",
    },
    audioConfig: {
      audioEncoding: "MP3",
    },
  };

  const [res] = await client.synthesizeSpeech(req);
  fs.writeFileSync(outputFilePath, res.audioContent, "binary");
  console.log(`Audio saved as ${outputFilePath}`);
  return outputFilePath;
};
