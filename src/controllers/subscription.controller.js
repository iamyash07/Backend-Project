import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
  
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    const userId = req.user?._id
    // check if subscription already exist 
    const existingSubcription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    })

    let result
    if (existingSubcription) {
        result = await Subscription.findByIdAndDelete(existingSubcription._id)
        if (!result) {
            throw new ApiError(500, "Failed to unsubscribe from channel")
        }
        return res.status(200)
            .json(new ApiResponse(200, {}, "Unsubscribed from channel"))
    } else {
        // If no subscription exist, create a new subscription
        result = await Subscription.create({
            subscriber: userId,
            channel: channelId
        })
        if (!result) {
            throw new ApiError(500, " Failed to subscribe the channel")
        }
        return res.status(200)
            .json(new ApiResponse(200, {}, "Successfully subscribed to channel"))
    }

})


const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, " Invalid channel ID")
    }
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails"
            }
        },
        {
            $unwind: "$subscriberDetails"
        },
        {
            $project: {
                subscriber: 1,
                channel: 1,
                subscriberDetails: {
                    _id: 1,
                    fullName: 1,
                    username: 1,
                    avatar: 1
                },
                createdAt: 1,
                updatedAt: 1
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, subscribers, "Channel subscribers retrieved successfully")
    )
})


const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID")
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails"
            }
        },
        {
            $unwind: "$channelDetails"
        },
        {
            $project: {
                subscriber: 1,
                channel: 1,
                channelDetails: {
                    _id: 1,
                    fullName: 1,
                    username: 1,
                    avatar: 1
                },
                createdAt: 1,
                updatedAt: 1
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, subscribedChannels, "Subscribed channels retrieved successfully")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}