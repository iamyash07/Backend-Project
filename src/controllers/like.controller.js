import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
 

    const userId = req.user?._id

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // check if the user has already liked the video

    const existingLike = await Like.findOne({
        video: videoId,
        owner: userId
    })

    let result
    if (existingLike) {

        // If like exist, remove it(unlike)

        result = await Like.findByIdAndDelete(existingLike)

        if (!result) {
            new ApiError(500, "Failed to remove the like")
        }
        return res.status(200)
            .json(new ApiResponse(200, {}, "Video unlike successfully"))
    } else {

        // If no like exist , create a new like 

        result = await Like.create({
            video: videoId,
            owner: userId
        })
        if (!result) {
            throw new ApiError(500, " failed to like video")
        }
        return res.status(200)
            .json(new ApiResponse(200, {}, "video liked successfully"))
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
  
    const userId = req.user?._id

    if (!isValidObjectId.commentId) {
        throw new ApiError("404", " Invalid comment ID")
    }

    // Check if the user has already liked  this comment

    const existingLike = await Like.findOne({
        comment: commentId,
        owner: userId

    })
    let result
    if (existingLike) {
        // If like exists, remove it (unlike)
        result = await Like.findByIdAndDelete(existingLike._id)

        if (!result) {
            throw new ApiError(500, "failed to remove the like")
        }

        return res.status(200)
            .json(new ApiResponse(200, {}, "Comment unliked successfully"))

    } else {
        // If no like , create a new one 

        result = await Like.create({
            comment: commentId,
            owner: userId
        })
        if (!result) {
            throw new ApiError(500, "Failed to like the comment")
        }
        res.staus(200)
            .json(new ApiResponse(200, {}, "comment liked successfully"))
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
   
    const userId = req.user?._id
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "invalid Tweet ID")
    }

    // check if user has alrady like the tweet

    const existingLike = await Like.findOne({
        tweet: tweetId,
        owner: userId
    })

    let result
    if (existingLike) {
        result = await Like.findByIdAndDelete(existingLike._Id)
        if (!result) {
            throw new ApiError(500, "Failed to remove  like ")
        }
        return res.status(200)
            .json(new ApiResponse(200, {}, "Tweet unliked successfully"))
    } else {
        result = Like.create({
            tweet: tweetId,
            owner: userId
        })
        if (!result) {
            throw new ApiError(500, "Failed to like Tweet")
        }
        return res.status(200)
            .json(new ApiResponse(200, {}, "Liked tweet successfully"))
    }


})

const getLikedVideos = asyncHandler(async (req, res) => {
  
    const likedVideos = await Like.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
                video: { $exist: ture }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        { $unwind: "$videoDetails" },
        {
            $lookup: {
                from: "users",
                localField: "videoDetails.owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        { $unwind: "$ownerDetails" },
        {
            $project: {
                video: 1,
                videoDetails: {
                    _id: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    views: 1,
                    isPublished: 1,
                    owner: 1,
                    createdAt: 1
                },
                ownerDetails: {
                    _id: 1,
                    fullName: 1,
                    username: 1,
                    avatar: 1
                },
                createdAt: 1
            }
        },
        { $sort: { createdAt: -1 } }
    ])

    return res.status(200).json(
        new ApiResponse(200, likedVideos, "Liked videos retrieved successfully")
    )

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}

