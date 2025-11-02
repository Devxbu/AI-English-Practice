const { recordAudio } = require('./utils/recordAudio');
const { transcribeAudio } = require('./utils/transcribeAudio');
const { talkWithAI } = require('./utils/talkingAI');
const { transformTextToSpeech } = require('./utils/textToSpeech');
const { playMP3 } = require('./utils/mp3Player');
const fs = require('fs');

const main = async () => {
    process.stdin.setRawMode(true);
    process.stdin.setEncoding("utf8");
    process.stdin.resume();
    process.stdin.on("data", (key) => {
        if (key === "\u0003") {
            console.log("Exiting...");
            try { if (fs.existsSync("output.mp3")) fs.unlinkSync("output.mp3"); } catch {}
            try { if (fs.existsSync("recorded.wav")) fs.unlinkSync("recorded.wav"); } catch {}
            process.exit();
        }
    });
    while (true) {
        await recordAudio();
        const transcript = await transcribeAudio();
        if (!transcript || transcript.trim() === '' || transcript === '[No speech detected]') {
            console.log('No speech detected, starting a new turn...');
            continue;
        }
        const text = await talkWithAI(transcript);
        const audioPath = await transformTextToSpeech(text);
        await playMP3(audioPath);
    }
};

main();