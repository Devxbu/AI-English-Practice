const { PvRecorder } = require("@picovoice/pvrecorder-node");
const dotenv = require('dotenv');
const wav = require('wav');

dotenv.config();

module.exports.recordAudio = async (outputFile = "recorded.wav") => {
    const frameLength = 512;
    const sampleRate = 16000;
    const recorder = new PvRecorder(frameLength);

    const fileWriter = new wav.FileWriter(outputFile, {
        sampleRate: sampleRate,
        channels: 1,
        bitDepth: 16,
    });

    let run = true;
    const onData = (key) => {
        if (key === "q") {
            console.log("Q pressed. Stopping recording...");
            run = false;
        }
    };
    process.stdin.on("data", onData);

    try {
        console.log("Recording started");
        recorder.start();

        while (run) {
            const pcm = await recorder.read();
            const buffer = Buffer.alloc(pcm.length * 2);
            for (let i = 0; i < pcm.length; i++) {
                buffer.writeInt16LE(pcm[i], i * 2);
            }
            fileWriter.write(buffer);
        }

    } catch (err) {
        console.error("Recording error:", err);
    } finally {
        recorder.stop();
        recorder.release();
        fileWriter.end();
        process.stdin.removeListener("data", onData);
    }
};