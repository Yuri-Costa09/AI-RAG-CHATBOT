import axios from "axios";

export async function getVectorQueriesService(embeddings, projectName) {
    const AZURE_AI_SEARCH_KEY = process.env.AZURE_AI_SEARCH_KEY;
    const AZURE_AI_SEARCH_ENDPOINT = process.env.AZURE_AI_SEARCH_ENDPOINT;

    const vectorQueries = await axios.post(
        `${AZURE_AI_SEARCH_ENDPOINT}`,
        {
            count: true,
            select: "content, type",
            top: 10,
            filter: `projectName eq '${projectName}'`,
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
    // Verify if the user needs to be handed over to a human
    // by checking if the type is N2
    let needHuman = false;
    if (vectorQueries.data.value[ 0 ].type === "N2") {
        needHuman = true;
    }
    return {
        vectorQueries: vectorQueries.data,
        needHuman: needHuman
    };
} 