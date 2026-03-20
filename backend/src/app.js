import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import passport from "./config/passport.js";
import { authMiddleware } from "./middleware/auth.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

import authRoutes from "./modules/auth/auth.routes.js";
import communityRoutes from "./modules/community/community.routes.js";
import issueRoutes from "./modules/issues/issue.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import aiRoutes from "./modules/ai/ai.routes.js";

const app = express();
app.use(passport.initialize());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

app.use("/auth", authRoutes);
app.use("/community", authMiddleware, communityRoutes);
app.use("/issue", authMiddleware, issueRoutes);
app.use("/users", authMiddleware, userRoutes);
app.use("/ai", authMiddleware, aiRoutes);

app.use(errorMiddleware);

export default app;
