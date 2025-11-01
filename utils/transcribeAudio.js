const speech = require('@google-cloud/speech');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

module.exports.transcribeAudio = async (audioPath = "recorded.wav") => {
    try {
        const client = new speech.SpeechClient();

        const file = fs.readFileSync(audioPath);
        const audioBytes = file.toString('base64');

        const audio = { content: audioBytes };
        const config = {
            encoding: "LINEAR16",
            sampleRateHertz: 16000,
            languageCode: "en-US", // You can change this to other languages 
            enableAutomaticPunctuation: true,
        };

        const [response] = await client.recognize({ config, audio });

        const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');

        return transcription || "[No speech detected]";
    } catch (error) {
        console.error('Error transcribing audio:', error);
    } finally {
        fs.unlinkSync(audioPath);
    }
};