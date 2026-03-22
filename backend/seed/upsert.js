import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { Pinecone } from "@pinecone-database/pinecone";

dotenv.config({
  path: "../.env",
});

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pc.index(process.env.PINECONE_INDEX, process.env.PINECONE_HOST);

import { createEmbeddingsBatch } from "../src/services/embed.service.js";

const NAMESPACE = "global";

const documents = [
  "Netravaah is an AI-powered platform that helps users collaborate on projects.",
  "Users can create teams, assign tasks, and track project progress efficiently.",
  "The platform uses AI to generate step-by-step project plans.",
  "Company policy: Users must not share sensitive data publicly.",
  "Support is available 24/7 via chat and email.",
  "My name is Anmol Saxena.",
];

const chunkText = (text, size = 300) => {
  const words = text.split(" ");
  const chunks = [];

  for (let i = 0; i < words.length; i += size) {
    chunks.push(words.slice(i, i + size).join(" "));
  }

  return chunks;
};

const run = async () => {
  try {
    console.log("🚀 Starting ingestion...");

    const allChunks = documents.flatMap((doc) => chunkText(doc));
    console.log("📦 Total chunks:", allChunks.length);

    const embeddings = await createEmbeddingsBatch(allChunks);
    console.log("Embedding dimension:", embeddings[0].length);
    const vectors = allChunks.map((text, i) => ({
      id: uuidv4(),
      values: embeddings[i],
      metadata: {
        text,
        source: "seed",
        createdAt: new Date().toISOString(),
      },
    }));

    await index.namespace(NAMESPACE).upsert({ records: vectors });

    console.log("✅ Successfully upserted vectors!");
  } catch (error) {
    console.error("❌ Upsert Error:", error);
  }
};

run();
