import express from "express";
import { roleMiddleware } from "../../middleware/role.middleware.js";

// import {
//   // createIssue,
//   // getNearbyIssues,
//   // searchIssues,
//   // getIssueById,
//   // getMyIssues,
//   // updateIssue,
//   // deleteIssue,
//   // addIssueMedia,
//   // deleteIssueMedia,
//   // assignIssue,
//   // updateIssueStatus,
//   // getIssueAIAnalysis,
//   // getTopPriorityIssues,
//   // getTrendingIssues,
//   // getIssueCategoryStats,
//   // getIssueHeatmap,
//   // generatePresignedURLs,
// } from "./issue.controller.js";

const router = express.Router();

// router.post("/uploads", generatePresignedURLs);
// router.post("/", createIssue);
// router.get("/nearby", getNearbyIssues);
// router.get("/search", searchIssues);
// router.get("/:issueId", getIssueById);
// router.get("/user/me", getMyIssues);
// router.put("/:issueId", updateIssue);
// router.delete("/:issueId", deleteIssue);
// router.post("/:issueId/media", upload.array("media", 5), addIssueMedia);
// router.delete("/:issueId/media/:mediaId", deleteIssueMedia);
// router.put("/:issueId/assign", roleMiddleware("ADMINISTRATOR"), assignIssue);
// router.put(
//   "/:issueId/status",
//   roleMiddleware("ADMINISTRATOR", "LEADER"),
//   updateIssueStatus,
// );
// router.get("/:issueId/ai", getIssueAIAnalysis);
// router.get("/analytics/top-priority", getTopPriorityIssues);
// router.get("/analytics/trending", getTrendingIssues);
// router.get("/analytics/categories", getIssueCategoryStats);
// router.get("/analytics/heatmap", getIssueHeatmap);

export default router;
