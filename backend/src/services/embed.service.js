import axios from "axios";

const normalizeText = (text) => {
  text = text?.trim().replace(/\s+/g, " ");
  return text;
};

const formatQuery = (text) => `query: ${normalizeText(text)}`;
const formatDocument = (text) => `passage: ${normalizeText(text)}`;
export const createEmbedding = async (text, type = "query") => {
  if (!text) return [];

  const input = type === "query" ? formatQuery(text) : formatDocument(text);

  const response = await axios.post(
    process.env.EMBEDDING_API_URL,
    { inputs: input },
    {
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
      },
    },
  );

  return response.data;
};

export const createEmbeddingsBatch = async (texts = []) => {
  if (!texts.length) return [];

  const inputs = texts.map((t) => formatDocument(t));

  const response = await axios.post(
    process.env.EMBEDDING_API_URL,
    { inputs },
    {
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
      },
    },
  );

  return response.data;
};
