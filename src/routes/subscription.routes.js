import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.controller.js"

const router = Router();


router.route("/c/:channelId").patch(verifyJWT, toggleSubscription)

router.route("/subscribers/c/:channelID").get(verifyJWT, getUserChannelSubscribers)

router.route("/channels").get(verifyJWT, getSubscribedChannels)

export default router;