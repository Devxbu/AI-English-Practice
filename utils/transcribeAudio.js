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
            languageCode: "en-US",
            enableAutomaticPunctuation: true,
            enableWordTimeOffsets: true,
            enableWordConfidence: true,
        };

        const [response] = await client.recognize({ config, audio });

        const parts = [];
        const words = [];
        let confidences = [];
        for (const result of response.results || []) {
            const alt = result.alternatives && result.alternatives[0];
            if (!alt) continue;
            if (alt.transcript) parts.push(alt.transcript.trim());
            if (Array.isArray(alt.words)) {
                for (const w of alt.words) {
                    const start = Number(w.startTime?.seconds || 0) + Number(w.startTime?.nanos || 0) / 1e9;
                    const end = Number(w.endTime?.seconds || 0) + Number(w.endTime?.nanos || 0) / 1e9;
                    words.push({ word: w.word, start, end, confidence: w.confidence });
                    if (typeof w.confidence === 'number') confidences.push(w.confidence);
                }
            }
        }
        const transcript = parts.join('\n');
        const avgConfidence = confidences.length ? (confidences.reduce((a, b) => a + b, 0) / confidences.length) : undefined;

        return {
            transcript: transcript || "[No speech detected]",
            words,
            confidence: avgConfidence,
        };
    } catch (error) {
        console.error('Error transcribing audio:', error);
        return { transcript: "[No speech detected]", words: [], confidence: undefined };
    } finally {
        try { fs.unlinkSync(audioPath); } catch {}
    }
};