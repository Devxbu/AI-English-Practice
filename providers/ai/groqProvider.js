const { Groq } = require('groq-sdk');

function createGroqProvider(config = {}) {
  const groq = new Groq();
  const model = config.model || 'llama-3.1-8b-instant';
  const temperature = config.temperature != null ? config.temperature : 0.7;
  const top_p = config.top_p != null ? config.top_p : 0.9;
  const max_tokens = config.max_completion_tokens != null ? config.max_completion_tokens : 512;

  function buildSystem({ scenario, level } = {}) {
    const base = (
      config.systemPrompt ||
      "You are a friendly, natural English tutor helping Bahri practice real-life conversation.\n" +
      "Goals: keep a flowing chat, encourage speaking, and help improve gently.\n" +
      "Style: everyday English, warm and concise, 1–3 sentences by default.\n" +
      "Guidelines:\n- Do not over-correct; fix only if meaning is unclear or if the user asks.\n- Offer a natural phrasing when the user struggles, briefly.\n- Ask occasional follow-up questions to keep the dialog going.\n- Use common topics: daily life, goals, hobbies, work, culture, relationships.\n- No emojis. No bullet lists unless explicitly requested."
    );
    const parts = [base];
    if (level) parts.push(`Level: Speak like a ${level} English tutor.`);
    if (scenario) parts.push(`Scenario: Roleplay as ${scenario}.`);
    return parts.join('\n');
  }

  async function streamToString(req) {
    const chatCompletion = await groq.chat.completions.create(req);
    let str = '';
    for await (const chunk of chatCompletion) {
      const c = chunk?.choices?.[0]?.delta?.content;
      if (c) str += c;
    }
    return str;
  }

  async function chat({ text, scenario, level }) {
    return streamToString({
      messages: [
        { role: 'system', content: buildSystem({ scenario, level }) },
        { role: 'user', content: text }
      ],
      model,
      temperature,
      max_completion_tokens: max_tokens,
      top_p,
      stream: true,
      stop: null,
    });
  }

  async function corrections({ transcript, scenario, level }) {
    const system = buildSystem({ scenario, level }) +
      "\nCorrection Mode: Provide concise corrections and a natural rewrite for the user's last message. Keep it short (2-4 lines).";
    return streamToString({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Please correct this message and suggest a natural phrasing:\n\n${transcript}` }
      ],
      model,
      temperature: 0.4,
      max_completion_tokens: 256,
      top_p: 0.9,
      stream: true,
      stop: null,
    });
  }

  async function monologue({ topic, minutes = 2, level }) {
    const system = buildSystem({ level }) +
      "\nListening Mode: Speak continuously on the topic in clear, natural English, then ask one comprehension question.";
    return streamToString({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Topic: ${topic || 'General conversation'}. Duration target: ${minutes} minutes of speech in total, concise paragraphs.` }
      ],
      model,
      temperature,
      max_completion_tokens: Math.min(2048, max_tokens * 3),
      top_p,
      stream: true,
      stop: null,
    });
  }

  return { chat, corrections, monologue };
}

module.exports = { createGroqProvider };
