import axios from "axios";

// Store clarifications per session
const sessionClarifications = new Map();

export async function getChatCompletionService(content, vectorDbValues, needHuman, helpdeskId) {
    try {
        if (needHuman) {
            return {
                choices: [
                    { message: { content: "That's an important question! I'm passing this over to a specialized team member who'll get back to you as soon as possible. Feel free to relax, and we'll be right with you." } }
                ],
                needHuman: true
            }
        }

        const searchScore = vectorDbValues[ 0 ][ "@search.score" ];

        // Get current clarifications count for this session
        const sessionKey = helpdeskId;
        const currentClarifications = sessionClarifications.get(sessionKey) || 0;
        const MAX_CLARIFICATIONS = 2;

        if (searchScore <= 0.49) {
            if (currentClarifications < MAX_CLARIFICATIONS) {
                // Increment clarifications count
                sessionClarifications.set(sessionKey, currentClarifications + 1);
                return {
                    choices: [
                        { message: { content: "Hello! How can I assist you today? I'm Claudia, your Tesla support assistant 😊 Could you please provide me with more information about your question? So i provide you with the most accurate answer." } }
                    ],
                    needHuman: false
                }
            } else {
                return {
                    choices: [
                        { message: { content: "I'll redirect you to a human agent. We'll be right with you." } }
                    ],
                    needHuman: true
                }
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
                max_tokens: 450,
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
        return {
            ...chatCompletion.data,
            needHuman: false
        };
    } catch (err) {
        console.error("Error calling chat completion:", err.response?.status, err.response?.data);
        throw err;
    }
} 