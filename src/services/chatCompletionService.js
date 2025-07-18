import axios from "axios";

export async function getChatCompletionService(content, vectorDbValues, needHuman) {
    try {
        if (needHuman) {
            return {
                choices: [
                    { message: { content: "That's an important question! I'm passing this over to a specialized team member who'll get back to you as soon as possible. Feel free to relax, and we'll be right with you." } }
                ]
            }
        }

        const OPENAI_KEY = process.env.OPENAI_KEY;
        const OPENAI_MODEL = process.env.OPENAI_MODEL;
        const SYSTEM_PROMPT = {
            "persona": "You are Claudia, Tesla's support assistant. Educated, friendly and reliable.",
            "tone": [ "professional", "friendly", "no technical jargon" ],
            "goal": "Only answer questions with the content you are provided with. Do not use any information outside the ones you receive.",
            "style": {
                "paragraphs": "short, with spacing between them",
                "start": "with greeting",
                "end": "with invitation to more questions"
            },
            "emoji_policy": "use only when reinforcing empathy, at the beginning or end of the message"
        }

        const system_prompt_formatted = JSON.stringify(SYSTEM_PROMPT);

        const chatCompletion = await axios.post(
            `https://api.openai.com/v1/chat/completions`,
            {
                model: OPENAI_MODEL,
                max_tokens: 500,
                messages: [
                    { role: "system", content: `${system_prompt_formatted}, ${vectorDbValues.map(item => item.content).join("\n")}` },
                    { role: "user", content: content }
                ]
            },
            {
                headers: {
                    "Authorization": `Bearer ${OPENAI_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );
        console.log(chatCompletion);
        return chatCompletion.data;
    } catch (err) {
        console.error("Error calling chat completion:", err.response?.status, err.response?.data);
        throw err;
    }
} 