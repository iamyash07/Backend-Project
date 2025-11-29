import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
} from "../controllers/like.controller.js"

const router = Router()

router.route("/:commentId").patch(verifyJWT, toggleCommentLike)
router.route("/:tweetId").patch(verifyJWT, toggleTweetLike)
router.route("/:videoId").patch(verifyJWT, toggleVideoLike)
router.route("/my-liked-videos").get(verifyJWT, getLikedVideos)
export default router;