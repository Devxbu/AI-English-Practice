const { Groq } = require('groq-sdk');
const dotenv = require('dotenv');

dotenv.config();

module.exports.talkWithAI = async (text) => {
    const groq = new Groq();

    const chatCompletion = await groq.chat.completions.create({
        "messages": [
            {
                "role": "system",
                "content": "You are an English-speaking conversation partner designed to help the user (Bahri) practice real-life English.\nSpeak in a friendly, natural, and conversational way — like a person chatting over coffee.  \nUse clear, everyday English, not formal or academic language.  \nYour goal is to keep the conversation flowing, encourage the user to respond in English, and help them improve naturally.  \n\nRules:\n- Do NOT correct every small grammar mistake unless it makes the sentence unclear.\n- If the user struggles to express something, gently offer a natural way to say it.\n- Sometimes ask follow-up questions to keep the conversation going.\n- Talk about everyday topics: life, goals, hobbies, work, culture, thoughts, etc.\n- Avoid robotic or overly formal tone — sound relaxed and human.\n- Use emojis or small reactions occasionally if it feels natural (e.g. \"That sounds great! 😊\").\n- Keep messages between 1–4 sentences unless the user asks for more detailed explanations."
            },
            {
                "role": "user",
                "content": text
            }
        ],
        "model": "openai/gpt-oss-20b",
        "temperature": 1,
        "max_completion_tokens": 8192,
        "top_p": 1,
        "stream": true,
        "reasoning_effort": "medium",
        "stop": null
    });

    let string = "";
    for await (const chunk of chatCompletion) {
        if (chunk.choices[0].delta.content !== "" && chunk.choices[0].delta.content !== null && chunk.choices[0].delta.content !== undefined) {
            string += chunk.choices[0].delta.content;
        }
    }
    return string;
};

