import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import llm from "../../config/llm.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const promptsDir = path.join(__dirname, "prompts");

export const getIssueAIAnalysis = async (req, res, next) => {
  try {
    const {
      issueType,
      locationName,
      latitude,
      longitude,
      reportCount,
      sentimentScore,
      priorityScore,
    } = req.body;

    const systemPrompt = await fs.readFile(
      path.join(promptsDir, "system_prompt.txt"),
      "utf-8",
    );

    const userPromptTemplate = await fs.readFile(
      path.join(promptsDir, "user_prompt.txt"),
      "utf-8",
    );

    const userPrompt = userPromptTemplate
      .replace("{{issueType}}", issueType)
      .replace("{{locationName}}", locationName)
      .replace("{{latitude}}", latitude)
      .replace("{{longitude}}", longitude)
      .replace("{{reportCount}}", reportCount)
      .replace("{{sentimentScore}}", sentimentScore)
      .replace("{{priorityScore}}", priorityScore);

    const response = await llm.invoke([
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ]);
    res.json({
      success: true,
      report: response.content,
    });
  } catch (error) {
    next(error);
  }
};
// export const createIssue = async (req, res, next) => {};
// getNearbyIssues,
// searchIssues,
// getIssueById,
// getMyIssues,
// updateIssue,
// deleteIssue,
// addIssueMedia,
// deleteIssueMedia,
// assignIssue,
// updateIssueStatus,
// getIssueAIAnalysis,
// getTopPriorityIssues,
// getTrendingIssues,
// getIssueCategoryStats,
// getIssueHeatmap,
// generatePresignedURLs,
