import express from "express";
import dotenv from "dotenv";
import { getChatCompletionService } from "./services/chatCompletionService.js";
import { getVectorQueriesService } from "./services/vectorQueriesService.js";
import { getEmbeddingService } from "./services/embeddingService.js";

dotenv.config();

const app = express();
app.use(express.json())

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});

// main endpoint
app.post("/conversations/completions", async (req, res) => {
    const { messages } = req.body;
    const { helpdeskId, projectName } = req.body;
    const content = messages[ 0 ].content;

    const embeddings = await getEmbeddingService(content);

    const { vectorQueries, needHuman } = await getVectorQueriesService(embeddings);

    const vectorDbValues = vectorQueries.value;

    const chatCompletion = await getChatCompletionService(content, vectorDbValues, needHuman, helpdeskId);
    console.log(chatCompletion.choices[ 0 ].message.content);

    res.json({
        messages: [
            {
                role: "USER",
                content: content
            },
            {
                role: "ASSISTANT",
                content: chatCompletion.choices[ 0 ].message.content
            }
        ],
        handoverToHumanNeeded: chatCompletion.needHuman,
        sectionsRetrieved: vectorDbValues.map(item => ({
            content: item.content,
            searchScore: item[ "@search.score" ],
        }))
    })
});

export default app;