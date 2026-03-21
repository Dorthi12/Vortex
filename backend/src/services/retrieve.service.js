import index from "../config/pinecone.js";
import { createEmbedding } from "./embed.service.js";

export const retrieveContext = async ({ query, userId, topK = 5 }) => {
  try {
    if (!query) return [];

    const queryEmbedding = await createEmbedding(query);
    const userResults = await index.namespace(userId).query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    });
    const globalResults = await index.namespace("global").query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    });

    const allMatches = [
      ...(userResults.matches || []),
      ...(globalResults.matches || []),
    ];

    if (!allMatches.length) return [];
    allMatches.sort((a, b) => b.score - a.score);
    const topMatches = allMatches.slice(0, topK);

    return topMatches.map((m) => m.metadata?.text).filter(Boolean);
  } catch (error) {
    console.error("Retrieval Error:", error);
    return [];
  }
};
