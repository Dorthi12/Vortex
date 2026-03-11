import express from "express";

import { getUserInfo, updateUserInfo, deleteUser } from "./user.controller.js";

const router = express.Router();
router.get("/", getUserInfo);
router.put("/", updateUserInfo);
router.delete("/", deleteUser);
export default router;
