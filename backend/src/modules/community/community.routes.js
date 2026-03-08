import express from "express";
import { uploadMultiple } from "../../middleware/upload.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";

import { postSchema } from "./community.validator.js";

import {
  getFeed,
  getUserPosts,
  createPost,
  votePost,
  getPostVotes,
  createComment,
  getPostComments,
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
} from "./community.controller.js";

const router = express.Router();

router.post(
  "/posts",
  validate(postSchema),
  uploadMultiple("media", 5),
  createPost,
);
router.get("/posts/user/:userId", getUserPosts);
router.get("/feed", getFeed);
router.post("/posts/:postId/vote", votePost);
router.get("/posts/:postId/votes", getPostVotes);
router.post("/posts/:postId/comments", createComment);
router.get("/posts/:postId/comments", getPostComments);
router.get("/users/:userId/followers", getFollowers);
router.post("/users/:userId/", followUser);
router.put("/users/:userId", unfollowUser);
router.get("/users/:userId/following", getFollowing);

export default router;
