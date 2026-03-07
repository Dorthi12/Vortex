import express from "express";
import { uploadMultiple } from "../../middleware/upload.middleware.js";
import {
  createIssue,
  getNearbyIssues,
  searchIssues,
  getIssueById,
  getMyIssues,
  updateIssue,
  deleteIssue,
  addIssueMedia,
  deleteIssueMedia,
  assignIssue,
  updateIssueStatus,
  analyzeIssue,
  getIssueAIAnalysis,
  getTopPriorityIssues,
  getTrendingIssues,
  getIssueCategoryStats,
  getIssueHeatmap,
} from "./issue.controller.js";

const router = express.Router();

router.post("/", uploadMultiple("media", 5, "issues"), createIssue);
router.get("/nearby", getNearbyIssues);
router.get("/search", searchIssues);
router.get("/:issueId", getIssueById);
router.get("/user/me", getMyIssues);
router.patch("/:issueId", updateIssue);
router.delete("/:issueId", deleteIssue);
router.post("/:issueId/media", upload.array("media", 5), addIssueMedia);
router.delete("/:issueId/media/:mediaId", deleteIssueMedia);
router.patch("/:issueId/assign", assignIssue);
router.patch("/:issueId/status", updateIssueStatus);
router.get("/:issueId/ai", getIssueAIAnalysis);
router.get("/analytics/top-priority", getTopPriorityIssues);
router.get("/analytics/trending", getTrendingIssues);
router.get("/analytics/categories", getIssueCategoryStats);
router.get("/analytics/heatmap", getIssueHeatmap);

export default router;
