import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Import routes
import userRoutes from "./routes/user.routes.js";
import videoRoutes from "./routes/video.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import likeRoutes from "./routes/like.routes.js";

export const app = express();

// ---------- FIXED CORS ----------
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);

// ---------- Middleware ----------
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(cookieParser());

// ---------- Health Check ----------
app.get("/api/v1/healthcheck", (req, res) => {
  res.status(200).json({
    statusCode: 200,
    data: {
      message: "Server is  healthy and running successfully",
      uptime: process.uptime(),
      timestamp: new Date(),
    },
    message: { message: "Server is  healthy and running successfully" },
    success: true,
  });
});

// ---------- Routes ----------
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/videos", videoRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/likes", likeRoutes);

