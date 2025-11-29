import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    const validVideoId = mongoose.Types.ObjectId.isValid(videoId)
    if (!validVideoId) {
        throw new ApiError(400, "Invalid videoo ID")
    }
    const skip = parseInt((page - 1) * limit)
    const limitNum = parsetInt(limit)

    const comments = await comment.aggregate([
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
                UpdatedAt: 1
            }
        },
        {
            $sort: { createdAt: - 1 }
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
    return res.satus(200)
        .json(200, "Comments fetched successfully")

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { content } = req.body
    const { videoId } = req.params
    const userId = req.user?._id

    if (!content?.trim()) {
        throw new ApiError(400, " Comment content is required")
    }
    const validVideoId = mongoose.Types.ObjectId(videoId)
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
                foreignField: "._id",
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
        .json(new ApiResponse(201, populatedComment[0], "comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params
    const { content } = req.body
    const userId = req.user?._id

    if (!content?.trim()) {
        throw new ApiError(400, "comment content  is required and connot be empty ")
    }

    //validate commentId format

    const validCommentId = mongoose.Types.ObjectId(videoId)
    if (!validCommentId) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Find the comment to verify existence and owbership 
    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, " comment not found")
    }

    //Verify that the user is the owner of the comment 

    if (!comment.owner.equal(userId)) {
        throw new ApiError(403, "Unauthorized  to update  this comment")
    }

    // Update  the comment with the new content 

    const updateComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: content.trim(),
                updatedAt: Date.now()
            }
        },
        {
            new: true, // Return the  updated document 
            runValidators: true // Run schema validators
        }
    )

    if (!updateComment) {
        throw new ApiError(500, "Failed to update comment ")
    }

    // Populate the owner details to return complete comment information

    const populatedComment = await comment.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        { $unwind: "$ownerdetails" },
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

    return res(200)
        .json(new ApiResponse(200, populatedComment, "Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params
    const userId = req.user?._id

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, " comment not found")
    }
    if (!comment.owner.equals(userId)) {
        throw new ApiError(403, "Not authorized to delete the comment ")
    }

    await Comment.findByIdAndDelete(commentId)
    return res(200)
        .json(new ApiResponse(200, {}, "Comment deleted successfully"))

})



export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}