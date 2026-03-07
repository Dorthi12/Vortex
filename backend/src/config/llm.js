import { ChatGroq } from "@langchain/groq";

const llm = new ChatGroq({
  //   apiKey: process.env.GROQ_API_KEY,
  apiKey: "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",
  model: "llama-3.3-70b-versatile",
  temperature: 0.3,
});

export default llm;
