import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";        // ← ADD THIS
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
    loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updatedAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
} from "../controllers/user.controller.js";

const router = Router();

// Register → with avatar + coverImage upload
router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser
);

router.route("/login").post(loginUser);

// Secured routes
router.route("/logout").post(verifyJWT, logoutUser);                    // ← fixed typo
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updatedAccountDetails);

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage); // ← fixed path

// Optional username → /c = own channel, /c/johndoe = other's channel
// 1. Get own channel → /api/v1/users/c
// REMOVE verifyJWT JUST FOR TESTING
router.route("/c").get(getUserChannelProfile);
router.route("/c/:username").get(getUserChannelProfile);

router.route("/history").get(verifyJWT, getWatchHistory);              // better name than watch-History

export default router;