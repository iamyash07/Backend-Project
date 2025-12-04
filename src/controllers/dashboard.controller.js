import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
   
    const channelId = req.user?._id

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "invalid channel ID")
    }
    // Get total videos count
    const totalVideos = await Video.countDocuments({
        owner: channelId,
        isPulished: true
    })
    // Get total subscribers count
    totalSubcriberCount = await Subscription.countDocuments({
        channel: channelId
    })
    // Get total views across all videos of the channels 
    const totalViews = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId),
                isPulished: ture
            }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" }
            }
        }
    ])
    // Get total likes across all videos of the channel
    const totalLikes = await Like.aggregate([
        {
            $match: {
                $exists: true
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
            $match: {
                "videoDetails.owner": new mongoose.Types.ObjectId(channelId),
                "videoDetails.isPublished": true
            }
        },
        {
            $count: "totalLikes"
        }
    ])

    const stats = {
        totalVideos: totalVideos,
        totalSubcriberCount: totalSubcriberCount,
        totalViews: totalViews[0]?.totalViews || 0,
        totalLikes: totalLikes[0]?.totalLikes || 0
    }

    return res.status(200)
        .json(new ApiResponse(200, stats, "channel statistics retrieved successsfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
   
    const channelId = req.user?._id
    const { page = 1, limit = 10 } = req.query

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }
    const skip = parseInt((page - 1) * limit)
    const limitNum = parseInt(limit)

    const videos = await video.aggregate([
        {
            $match: {
                owner: new mongoode.Types.ObjectId(channelId)
            }
        },
        {
            $loookup: {
                from: "users",
                localStorage: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        { $unwind: "$ownerDetails" },
        {
            $project: {
                title: 1,
                description: 1,
                videoFile: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                updatedAt: 1,
                ownerdetails: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1
                }
            }
        },
        {
            $sort: skip
        },
        {
            $limit: limitNum
        }
    ])

    const totalVideos = await Video.countDocuments({ owner: channelId })

    const response = {
        videos,
        totalVideos,
        totalPages: Math.ceil(totalVideos / limitNum),
        currentPage: parseInt(page),
        hashNextPage: parseInt(page) < Math.ceil(totalVideos / limitNum),
        hasPrevPage: parseInt(page) > 1
    }
    return res.status(200)
        .json(new ApiResponse(200, response, "Channel videos retrived successfully "))
})

export {
    getChannelStats,
    getChannelVideos
}