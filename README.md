# AI English Practice

A terminal-based, hands-free English conversation app. It records your voice, transcribes it with Google Speech-to-Text, gets a natural reply from an AI (Groq), converts the reply to speech with Google Text-to-Speech, and plays it back.

## Features

- **Cross-platform recording**: PvRecorder (macOS/Windows), node-record-lpcm16 (Linux), file-based demo
- **Configurable playback** with a stoppable player (press `n` to skip)
- **Transcribe** speech to text with Google Cloud Speech-to-Text
- **Chat** with an English conversation partner via Groq
- **Speak back** using Google Cloud Text-to-Speech (MP3, neural voice) or Piper (free, local)
- **Event-driven, non-blocking flow**: next turn can start while audio plays
- **Retries/backoff** around STT, AI, and TTS for robustness
- **Session folders** per run to isolate artifacts
- **Learning features**: roleplay scenarios, difficulty levels, end-of-turn corrections, pronunciation feedback (heuristic), vocabulary export, listening-only mode, "continue last session"
- **Dual TTS providers**: Google (neural) and Piper (free, local). Emotion-aware prosody.

## Tech Stack

- Node.js (CommonJS)
- @google-cloud/speech, @google-cloud/text-to-speech
- groq-sdk
- @picovoice/pvrecorder-node, node-record-lpcm16
- play-sound, wav
- Node EventEmitter

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

# Optional runtime config
# RECORDER=auto|pvrecorder|lpcm16|file
# PLAYER=default
# DEVICE_INDEX=0
# SESSION_DIR=sessions
# DEMO=true|false
# AI_PROVIDER=groq
# DEMO_SOURCE_WAV=/absolute/path/to/sample.wav
```

## Session JSON format

- File: `sessions/<sessionId>/session.json`
- Structure (example):

```
{
  "sessionId": "20251102...",
  "startedAt": "2025-11-02T01:23:45.678Z",
  "meta": { "scenario": "coffee-shop", "level": "intermediate", "listening": false, "topic": "" },
  "turns": [
    {
      "ts": "2025-11-02T01:24:10.000Z",
      "mode": "dialog",
      "transcript": "hi I'd like a cappuccino",
      "sttConfidence": 0.92,
      "unclearWords": ["cappuccino"],
      "ai": "Sure! Small or large?",
      "corrections": "Say: 'I'd like a cappuccino, please.'",
      "userWordCount": 5
    }
  ],
  "summary": { "totalTurns": 5, "totalWords": 57, "avgConfidence": 0.88 }
}
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
npm start
```

What happens:

- The app waits for you to record.
- Press `q` to stop recording a turn.
- The app transcribes, chats with AI, synthesizes speech, and plays the reply.
- Playback is non-blocking; press `n` to skip playback.
- Press `Ctrl+C` to exit safely.

### Choose TTS provider

- Google (default): `node main.js --tts-provider=google`
- Piper (free, local): `node main.js --tts-provider=piper --piper-model=/abs/path/en_US-lessac-medium.onnx`

## Controls

- `q` — stop the current recording
- `n` — stop current playback (skip)
- `Ctrl+C` — exit the app (cleans up temp files like `output.mp3`, `recorded.wav`)

## File Flow

- Per-session directory: `sessions/<sessionId>/`
- `turn-<n>.wav` — temporary mic recording (16kHz mono PCM)
- `turn-<n>.mp3` — synthesized reply
- Files are cleaned when possible; session folders help isolate artifacts.

## Configuration

- Language: `en-US` (change in `utils/transcribeAudio.js` and `utils/textToSpeech.js`)
- Voice: neural `en-US-Neural2-F` with tuned prosody (change in `utils/textToSpeech.js`)
- Streaming responses from Groq are concatenated in `utils/talkingAI.js`.
- Choose recorder/player via CLI flags or env.

### CLI Flags

```
node main.js \
  --recorder=auto|pvrecorder|lpcm16|file \
  --player=default \
  --device-index=0 \
  --session-dir=sessions \
  --demo \
  --ai-provider=groq \
  --source-wav=/absolute/path/to/sample.wav \
  --tts-provider=google|piper \
  --piper-model=/abs/path/to/model.onnx \
  --piper-speaker=0 \
  --piper-length=1.0 \
  --piper-noise=0.6 \
  --piper-noise-w=0.8 \
  --voice=en-US-Neural2-J \
  --rate=1.0 \
  --pitch=0 \
  --scenario=coffee-shop|job-interview|travel \
  --level=beginner|intermediate|advanced \
  --corrections=end-of-turn|inline|off \
  --pronunciation-feedback \
  --export-vocab=csv \
  --listening \
  --topic="Space travel" \
  --minutes=2 \
  --continue
```

Examples:

- macOS PvRecorder: `node main.js --recorder=pvrecorder`
- Linux LPCM16: `node main.js --recorder=lpcm16`
- Demo (file input): `node main.js --recorder=file --source-wav=./sample.wav --demo`
- Scenario and level with corrections: `node main.js --scenario=coffee-shop --level=intermediate --corrections=end-of-turn`
- Listening-only: `node main.js --listening --topic="Traveling abroad" --minutes=2`
- Continue last session defaults: `node main.js --continue`
- Piper (recommended start): `node main.js --tts-provider=piper --piper-model=/abs/path/en_US-lessac-medium.onnx`
- Google A/B voice: `node main.js --tts-provider=google --voice=en-US-Neural2-J --rate=1.0 --pitch=0`

## Troubleshooting

- Recording errors on macOS:
  - Ensure the terminal has Microphone permissions (System Settings → Privacy & Security → Microphone).
- Linux recording:
  - Prefer `--recorder=lpcm16`. You may need ALSA/PulseAudio utilities installed.
- Windows/macOS recording:
  - Prefer `--recorder=pvrecorder`. Use `--device-index` to select the input device if needed.
- Playback errors:
  - macOS uses `afplay`; Linux/Windows will attempt a suitable backend via `play-sound`.
- Google auth errors:
  - Verify `GOOGLE_APPLICATION_CREDENTIALS` points to a valid Service Account JSON with the required APIs enabled.
- Empty transcription:
  - Speak clearly and ensure your input device is the default system mic.
- API/network flakiness:
  - Calls are retried with backoff automatically; check your connectivity and keys if issues persist.

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
├─ config.js
├─ utils/
│  ├─ recordAudio.js
│  ├─ transcribeAudio.js
│  ├─ talkingAI.js
│  ├─ textToSpeech.js
│  ├─ mp3Player.js (legacy - playback now via utils/audio/playerDefault)
│  ├─ retry.js
│  └─ audio/
│     ├─ index.js
│     ├─ recorderPv.js
│     ├─ recorderLpcm16.js
│     ├─ recorderFile.js
│     └─ playerDefault.js
├─ utils/
│  └─ tts/
│     ├─ index.js (select Google or Piper)
│     └─ piper.js (local, free TTS via piper binary)
├─ providers/
│  └─ ai/
│     └─ groqProvider.js
├─ package.json
├─ package-lock.json
├─ .env (not committed)
└─ README.md
```

## Quick Demo (no mic)

- Put a short WAV at 16kHz mono PCM somewhere, e.g. `./sample.wav`.
- Run: `node main.js --recorder=file --source-wav=./sample.wav --demo`
- The app will copy the WAV as the recording for the turn, then proceed normally.

## Security

- Keep your `.env` and Google key file private.
- Never commit credentials to version control.

## Piper setup (free, local TTS)

- Install Piper:
  - macOS: `brew install rhasspy/piper/piper`
  - Linux: see https://github.com/rhasspy/piper for packages or build steps
- Download a model (.onnx):
  - Prebuilt: https://github.com/rhasspy/piper#pre-built-models
  - Good starters: `en_US-lessac-medium.onnx`, `en_US-amy-low.onnx`
- Run with Piper:
  - `node main.js --tts-provider=piper --piper-model=/abs/path/en_US-lessac-medium.onnx`
- Optional tuning:
  - `--piper-speaker=0` (if multi-speaker model)
  - `--piper-length=1.0` (slower >1, faster <1)
  - `--piper-noise=0.6 --piper-noise-w=0.8` (expressiveness)

## Google voice A/B (neural)

- Switch voice/rate/pitch quickly:
  - `--voice=en-US-Neural2-J --rate=1.0 --pitch=0`
- Or set env:
  - `GOOGLE_VOICE`, `GOOGLE_RATE`, `GOOGLE_PITCH`
