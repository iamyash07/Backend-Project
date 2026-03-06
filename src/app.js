import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import userRoutes from "./routes/user.routes.js";
import videoRoutes from "./routes/video.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import likeRoutes from "./routes/like.routes.js";

export const app = express();

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

// CORS - Allow frontend to communicate with backend
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
    optionsSuccessStatus: 200,
  })
);

// Parse JSON body (limit 20mb for video metadata)
app.use(express.json({ limit: "20mb" }));

// Parse URL-encoded data
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Parse cookies
app.use(cookieParser());

// Serve static files (if any)
app.use(express.static("public"));

// ============================================
// HEALTH CHECK ROUTE
// ============================================

app.get("/api/v1/healthcheck", (req, res) => {
  res.status(200).json({
    statusCode: 200,
    data: {
      message: "Server is healthy and running successfully",
      uptime: process.uptime(),
      timestamp: new Date(),
      environment: process.env.NODE_ENV || "development",
    },
    message: "Health check passed",
    success: true,
  });
});

// ============================================
// API ROUTES
// ============================================

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/videos", videoRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/likes", likeRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// Handle 404 - Route not found
app.use((req, res) => {
  res.status(404).json({
    statusCode: 404,
    data: null,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    success: false,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[ERROR] ${statusCode} - ${message}`);
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    statusCode,
    data: null,
    message,
    success: false,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});