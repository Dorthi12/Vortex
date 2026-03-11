import express from "express";

import { validate } from "../../middleware/validate.middleware.js";
import {
  getUserInfo,
  updateUserInfo,
  deleteUser,
  searchUsers,
} from "./user.controller.js";
import { updateUserSchema } from "./user.validator.js";

const router = express.Router();
router.get("/", getUserInfo);
router.put("/", validate(updateUserSchema), updateUserInfo);
router.delete("/", deleteUser);
router.get("/search", searchUsers);

export default router;
