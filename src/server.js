import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json())

// TODO: THE API SHOULD RECEIVE ALSO THE PROJECT NAME AS A VARIABLE.

// Keys
const OPENAI_KEY = process.env.OPENAI_KEY;
const AZURE_AI_SEARCH_KEY = process.env.AZURE_AI_SEARCH_KEY;
const AZURE_AI_SEARCH_ENDPOINT = process.env.AZURE_AI_SEARCH_ENDPOINT;
const OPENAI_EMBEDDINGS_ENDPOINT = process.env.OPENAI_EMBEDDINGS_ENDPOINT;
const OPENAI_MODEL = process.env.OPENAI_MODEL;
const SYSTEM_PROMPT = `
You are a polite and kind assistant which answers precisely. Your name is Claudia, 
YOU MUST present yourself in every response as: "Hello! How can I assist you today? I'm Claudia, 
your Tesla support assistant 😊" You should finish every response with:
 "I hope this information was helpful! If you have any other questions, feel free to ask. Have a great day! 😊"
And must answer in the same language as the user's message. 
Do not use any information outside the ones you receive. 
Answer considering the most precise options,  but if the other contents make sense with the first, add to the answer.
  `.trim();

const test = {
    "helpdeskId": 123456,
    "projectName": "tesla_motors",
    "messages": [
        {
            "role": "USER",
            "content": "Hello! How long does a Tesla battery last before it needs to be replaced?"
        }
    ]
}

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});

// main endpoint
app.get("/conversations/completions", async (req, res) => {
    const { messages } = test;
    const content = messages[ 0 ].content;

    const embeddings = await getEmbedding(content);

    const vectorDbResponse = await getVectorQueries(embeddings);

    const vectorDbValues = vectorDbResponse.value;
    console.log(vectorDbValues);

    const chatCompletion = await getChatCompletion(content, vectorDbValues);

    console.log(chatCompletion.choices[ 0 ].message);

});

async function getChatCompletion(content, vectorDbValues) {
    try {
        const chatCompletion = await axios.post(
            `https://api.openai.com/v1/chat/completions`,
            {
                model: OPENAI_MODEL,
                // TODO: TEST WITH CONTENT ONLY & ALL OF THE RESPONSES
                messages: [
                    { role: "system", content: `${SYSTEM_PROMPT}, ${vectorDbValues.map(item => item.content).join("\n")}` },
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
        return chatCompletion.data;
    } catch (err) {
        console.error("Error calling chat completion:", err.response?.status, err.response?.data);
        throw err;
    }
}

//? After project is done, conver this function to receive the project name as parameter.
async function getVectorQueries(embeddings) {
    const vectorQueries = await axios.post(
        `${AZURE_AI_SEARCH_ENDPOINT}`,
        {
            count: true,
            select: "content, type",
            top: 10,
            filter: "projectName eq 'tesla_motors'",
            vectorQueries: [
                {
                    vector: embeddings,
                    k: 5,
                    kind: "vector",
                    fields: "embeddings"
                }
            ]
        },
        {
            headers: {
                "api-key": `${AZURE_AI_SEARCH_KEY}`,
                "Content-Type": "application/json"
            },
        }
    );
    return vectorQueries.data;
}

//? After project is done, convert this function to receive the content as a parameter.
async function getEmbedding() {
    try {
        const response = await axios.post(
            `${OPENAI_EMBEDDINGS_ENDPOINT}`,
            {
                model: "text-embedding-3-large",
                input: "How long does a Tesla battery last before it needs to be replaced?"
            },
            {
                headers: {
                    "Authorization": `Bearer ${OPENAI_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );
        const embeddings = response.data.data[ 0 ].embedding;
        return embeddings;
    } catch (err) {
        console.error("Error calling embeddings:", err.response?.status, err.response?.data);
        throw err;
    }
}

export default app;