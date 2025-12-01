// routes/tweet.routes.js

import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
} from "../controllers/tweet.controller.js";

const router = Router();



// Create a new tweet
router.route("/").post(verifyJWT, createTweet);

// Get all tweets of a specific user (publicly accessible)
router.route("/user/:userId").get(getUserTweets);

// Update a tweet (only owner)
router.route("/:tweetId").patch(verifyJWT, updateTweet);

//Delete tweet (only owner)
router.route("/:tweetId").delete(verifyJWT, deleteTweet);

export default router;