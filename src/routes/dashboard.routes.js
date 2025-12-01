import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controller.js";

const router = Router();

// Get channel statistics (total videos, subscribers, views, likes)
router.route("/stats").get(verifyJWT, getChannelStats);

// Get all videos uploaded by the channel owner
router.route("/videos").get(verifyJWT, getChannelVideos);

export default router;