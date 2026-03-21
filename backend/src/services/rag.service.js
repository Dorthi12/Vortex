import { retrieveContext } from "./retrieve.service.js";
import llm from "../config/llm.js";

export const generateRAGResponse = async ({ query, userId, history = [] }) => {
  const contexts = await retrieveContext({ query, userId });
  const contextText = contexts.join("\n");
  const useRag = contexts.length > 0;

  const messages = [
    {
      role: "system",
      content: `
You are an AI assistant chatbot for the website "Netravaah".
Give clear, step-by-step, accurate answers.

If relevant context is provided, use it.
If not, answer normally.

Do not guess unknown facts.
      `,
    },

    ...history,

    {
      role: "user",
      content: `
${useRag ? `Context:\n${contextText}\n\n` : ""}
Question: ${query}
      `,
    },
  ];

  const response = await llm.invoke(messages);

  const reply = typeof response.content === "string" ? response.content : "";

  return {
    reply,
    usedRag: useRag,
  };
};
