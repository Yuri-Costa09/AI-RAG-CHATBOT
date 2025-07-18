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
const OPENAI_CHAT_COMPLETION_ENDPOINT = process.env.OPENAI_CHAT_COMPLETION_ENDPOINT;
const OPENAI_MODEL = process.env.OPENAI_MODEL;
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT;

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

});

async function getChatCompletion(content) {
    const chatCompletion = await axios.post(
        `${OPENAI_CHAT_COMPLETION_ENDPOINT}`,
        {
            model: OPENAI_MODEL,
            // TODO: TEST WITH CONTENT ONLY & ALL OF THE RESPONSES
            messages: [ { role: "system", content: `${SYSTEM_PROMPT}, ${content.map(item => item.content).join("\n")}` } ]
        }
    );
    return chatCompletion.data;
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