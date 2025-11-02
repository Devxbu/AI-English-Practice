const { Groq } = require('groq-sdk');
const dotenv = require('dotenv');

dotenv.config();

module.exports.talkWithAI = async (text) => {
    const groq = new Groq();

    const chatCompletion = await groq.chat.completions.create({
        "messages": [
            {
                "role": "system",
                "content": "You are a friendly, natural English tutor helping Bahri practice real-life conversation.\nGoals: keep a flowing chat, encourage speaking, and help improve gently.\nStyle: everyday English, warm and concise, 1–3 sentences by default.\nGuidelines:\n- Do not over-correct; fix only if meaning is unclear or if the user asks.\n- Offer a natural phrasing when the user struggles, briefly.\n- Ask occasional follow-up questions to keep the dialog going.\n- Use common topics: daily life, goals, hobbies, work, culture, relationships.\n- No emojis. No bullet lists unless explicitly requested."
            },
            {
                "role": "user",
                "content": text
            }
        ],
        "model": "llama-3.1-8b-instant",
        "temperature": 0.7,
        "max_completion_tokens": 512,
        "top_p": 0.9,
        "stream": true,
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


