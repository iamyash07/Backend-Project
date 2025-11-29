import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from "../controllers/video.controller.js";

const router = Router();

router.route("/").get(getAllVideos)
router.route("/").post(verifyJWT, upload.single("video"), publishAVideo);

router.route("/:id").get(getVideoById)
router.route("/:id").patch(verifyJWT, updateVideo)
router.route("/:id").delete(verifyJWT, deleteVideo);

router.route("/:id/toggle-publish-status").patch(verifyJWT, togglePublishStatus);

export default router;
