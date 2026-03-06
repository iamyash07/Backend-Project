import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {

    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    const validVideoId = mongoose.Types.ObjectId.isValid(videoId)
    if (!validVideoId) {
        throw new ApiError(400, "Invalid video ID")
    }

    const skip = parseInt((page - 1) * limit)
    const limitNum = parseInt(limit)

    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        {
            $project: {
                content: 1,
                video: 1,
                owner: 1,
                ownerDetails: {
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
        },
        {
            $skip: skip
        },
        {
            $limit: limitNum
        }
    ])

    const totalComments = await Comment.countDocuments({ video: videoId })
    const response = {
        comments,
        totalComments,
        totalPages: Math.ceil(totalComments / limitNum),
        currentPage: parseInt(page),
        hasNextPage: parseInt(page) < Math.ceil(totalComments / limitNum),
        hasPrevPage: parseInt(page) > 1
    }

    return res.status(200)
        .json(new ApiResponse(200, response, "Comments fetched successfully"))
})

const addComment = asyncHandler(async (req, res) => {

    const { content } = req.body
    const { videoId } = req.params
    const userId = req.user?._id

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required")
    }

    const validVideoId = mongoose.Types.ObjectId.isValid(videoId)
    if (!validVideoId) {
        throw new ApiError(400, "Invalid Video ID")
    }

    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: userId
    })

    const populatedComment = await Comment.aggregate([
        { $match: { _id: comment._id } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        { $unwind: "$ownerDetails" },
        {
            $project: {
                content: 1,
                video: 1,
                owner: 1,
                ownerDetails: {
                    _id: 1,
                    fullName: 1,
                    username: 1
                },
                createdAt: 1,
                updatedAt: 1
            }
        }
    ])

    return res.status(201)
        .json(new ApiResponse(201, populatedComment[0], "Comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params
    const { content } = req.body
    const userId = req.user?._id

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required and cannot be empty")
    }

    const validCommentId = mongoose.Types.ObjectId.isValid(commentId)
    if (!validCommentId) {
        throw new ApiError(400, "Invalid comment ID")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (!comment.owner.equals(userId)) {
        throw new ApiError(403, "Unauthorized to update this comment")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: content.trim(),
                updatedAt: Date.now()
            }
        },
        {
            new: true,
            runValidators: true
        }
    )

    if (!updatedComment) {
        throw new ApiError(500, "Failed to update comment")
    }

    const populatedComment = await Comment.aggregate([
        { $match: { _id: updatedComment._id } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        { $unwind: "$ownerDetails" },
        {
            $project: {
                content: 1,
                video: 1,
                owner: 1,
                ownerDetails: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1
                },
                createdAt: 1,
                updatedAt: 1
            }
        }
    ])

    return res.status(200)
        .json(new ApiResponse(200, populatedComment[0], "Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params
    const userId = req.user?._id

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (!comment.owner.equals(userId)) {
        throw new ApiError(403, "Not authorized to delete this comment")
    }

    await Comment.findByIdAndDelete(commentId)

    return res.status(200)
        .json(new ApiResponse(200, {}, "Comment deleted successfully"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}