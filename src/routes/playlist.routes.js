import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
} from "../controllers/playlist.controller.js";

const router = Router();

// Create a new playlist
router.route("/").post(verifyJWT, createPlaylist);

// Get all playlists for a specific user
router.route("/user/:userId").get(getUserPlaylists);

// Get a specific playlist by ID
router.route("/:playlistId").get(getPlaylistById);

// Update a specific playlist
router.route("/:playlistId").patch(verifyJWT, updatePlaylist);

// Delete a specific playlist
router.route("/:playlistId").delete(verifyJWT, deletePlaylist);

// Add a video to a specific playlist
router.route("/:playlistId/videos/:videoId").post(verifyJWT, addVideoToPlaylist);

// Remove a video from a specific playlist
router.route("/:playlistId/videos/:videoId").delete(verifyJWT, removeVideoFromPlaylist);

export default router;