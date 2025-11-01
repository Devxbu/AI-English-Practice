# AI English Practice

A terminal-based, hands-free English conversation app. It records your voice, transcribes it with Google Speech-to-Text, gets a natural reply from an AI (Groq), converts the reply to speech with Google Text-to-Speech, and plays it back.

## Features

- **Record voice** using PvRecorder
- **Transcribe** speech to text with Google Cloud Speech-to-Text
- **Chat** with an English conversation partner via Groq
- **Speak back** using Google Cloud Text-to-Speech (MP3)
- **Looped flow**: record → transcribe → reply → synthesize → play

## Tech Stack

- Node.js (CommonJS)
- @google-cloud/speech, @google-cloud/text-to-speech
- groq-sdk
- @picovoice/pvrecorder-node
- play-sound, wav

## Prerequisites

- Node.js 18+
- macOS (works cross-platform, but recording/playback backends vary)
- Google Cloud project with:
  - Speech-to-Text API enabled
  - Text-to-Speech API enabled
  - Service Account JSON key
- Groq API key

## Environment Variables

Create a `.env` file in the project root with:

```
# Groq
GROQ_API_KEY=your_groq_api_key

# Google Cloud auth
# Absolute path to your Service Account JSON key file
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
```

Notes:

- The Google Cloud SDKs read `GOOGLE_APPLICATION_CREDENTIALS` for auth.
- `groq-sdk` reads `GROQ_API_KEY`.
- Do not commit `.env` or key files.

## Install

```
npm install
```

## Run

```
node main.js
```

What happens:

- The app waits for you to record.
- Press `q` to stop recording a turn.
- The app transcribes, chats with AI, synthesizes speech, and plays the reply.
- Press `Ctrl+C` to exit safely.

## Controls

- `q` — stop the current recording
- `Ctrl+C` — exit the app (cleans up temp files like `output.mp3`, `recorded.wav`)

## File Flow

- `recorded.wav` — temporary mic recording (16kHz mono PCM). Deleted after transcription.
- `output.mp3` — synthesized reply. Deleted after playback.

## Configuration

- Language: `en-US` (change in `utils/transcribeAudio.js` and `utils/textToSpeech.js`)
- Voice: `NEUTRAL` (change in `utils/textToSpeech.js`)
- Streaming responses from Groq are concatenated in `utils/talkingAI.js`.

## Troubleshooting

- Recording errors on macOS:
  - Ensure the terminal has Microphone permissions (System Settings → Privacy & Security → Microphone).
- Playback errors:
  - macOS uses `afplay` via `play-sound` by default. Ensure it’s available (it is on macOS).
- Google auth errors:
  - Verify `GOOGLE_APPLICATION_CREDENTIALS` points to a valid Service Account JSON with the required APIs enabled.
- Empty transcription:
  - Speak clearly and ensure your input device is the default system mic.

## Scripts

No start script is defined. Run with `node main.js`. You may add a script:

```
{
  "scripts": {
    "start": "node main.js"
  }
}
```

## Project Structure

```
.
├─ main.js
├─ utils/
│  ├─ recordAudio.js
│  ├─ transcribeAudio.js
│  ├─ talkingAI.js
│  ├─ textToSpeech.js
│  └─ mp3Player.js
├─ package.json
├─ package-lock.json
├─ .env (not committed)
└─ README.md
```

## Security

- Keep your `.env` and Google key file private.
- Never commit credentials to version control.
