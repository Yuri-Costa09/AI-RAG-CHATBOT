import axios from "axios";

export async function getEmbeddingService(content) {
    try {
        const OPENAI_KEY = process.env.OPENAI_KEY;
        const OPENAI_EMBEDDINGS_ENDPOINT = process.env.OPENAI_EMBEDDINGS_ENDPOINT;

        const response = await axios.post(
            OPENAI_EMBEDDINGS_ENDPOINT,
            {
                model: "text-embedding-3-large",
                input: content
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