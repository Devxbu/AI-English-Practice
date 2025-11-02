function splitSentences(text) {
  return String(text)
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
}

function emotionParams(emotion) {
  switch ((emotion || '').toLowerCase()) {
    case 'happy':
      return { rate: 'medium', pitch: '+1st', volume: 'default', breakStrength: 'medium' };
    case 'excited':
      return { rate: 'medium', pitch: '+2st', volume: 'default', breakStrength: 'medium' };
    case 'sad':
      return { rate: 'slow', pitch: '-1st', volume: 'default', breakStrength: 'strong' };
    case 'calm':
      return { rate: 'medium', pitch: '-0.5st', volume: 'default', breakStrength: 'medium' };
    default:
      return { rate: 'medium', pitch: '0st', volume: 'default', breakStrength: 'medium' };
  }
}

function detectEmotionHeuristic(text) {
  const t = (text || '').toLowerCase();
  const score = { happy: 0, excited: 0, sad: 0, calm: 0 };
  const inc = (k, v = 1) => (score[k] += v);
  if (/!/.test(t)) inc('excited', 2);
  if (/(great|awesome|wonderful|glad|happy|love)/.test(t)) inc('happy', 2);
  if (/(sorry|sad|bad|upset|tired|frustrated|angry)/.test(t)) inc('sad', 2);
  if (/(okay|alright|fine|calm|relax)/.test(t)) inc('calm', 1);
  // punctuation and length cues
  const words = t.split(/\s+/).filter(Boolean).length;
  if (words > 20 && /[!?]/.test(t)) inc('excited');
  if (words < 6 && /\./.test(t)) inc('calm');
  // choose max
  let best = 'calm';
  let bestVal = -Infinity;
  for (const k of Object.keys(score)) {
    if (score[k] > bestVal) { best = k; bestVal = score[k]; }
  }
  return best;
}

function emphasizeTokens(sentence) {
  // Add emphasis around words in ALL CAPS or with exclamation emphasis
  return sentence.replace(/\b([A-Z]{2,})\b/g, '<emphasis level="reduced">$1</emphasis>');
}

function buildEmotionSsml(text, { mode = 'auto', emotion = '' } = {}) {
  const selectedEmotion = mode === 'manual' && emotion ? emotion : detectEmotionHeuristic(text);
  const params = emotionParams(selectedEmotion);
  const sentences = splitSentences(text);
  const parts = [];
  parts.push(`<speak>`);
  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i].trim();
    if (!s) continue;
    const content = emphasizeTokens(s)
      // Slight emphasis for exclamations
      .replace(/!+/g, '!<break strength="weak"/>');
    parts.push(
      `<prosody rate="${params.rate}" pitch="${params.pitch}" volume="${params.volume}">` +
        content +
      `</prosody>`
    );
    // Natural pause/breath between sentences
    parts.push(`<break strength="${params.breakStrength}"/>`);
  }
  parts.push(`</speak>`);
  return { ssml: parts.join(''), emotion: selectedEmotion };
}

module.exports = { buildEmotionSsml, detectEmotionHeuristic };
