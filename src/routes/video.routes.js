import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    streamVideo
} from "../controllers/video.controller.js";

const router = Router();

router.route("/").get(getAllVideos)
router.route("/").post(verifyJWT, upload.single("video"), publishAVideo);

router.route("/:videoId").get(getVideoById)
router.route("/:videoId").patch(verifyJWT, updateVideo)
router.route("/:videoId").delete(verifyJWT, deleteVideo);

router.route("/:videoId/toggle-publish-status").patch(verifyJWT, togglePublishStatus);

router.get("/:videoId/stream", streamVideo);

export default router;
