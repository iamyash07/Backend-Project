import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query
    
    const filter = {}
    
    // Add search filter if query is provided
    if (query?.trim()) {
        filter.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ]
    }
    
    // Add user filter if userId is provided and validate it
    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user ID")
        }
        filter.owner = new mongoose.Types.ObjectId(userId)
    }
    
    // Only fetch published videos
    filter.isPublished = true
    
    const videos = await Video.find(filter)
        .sort({ [sortBy]: sortType === "desc" ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
    
    // Explicitly populate owner information using User model reference
    const populatedVideos = await Video.populate(videos, [
        { path: "owner", select: "fullName username avatar" }
    ])
    
    const totalVideos = await Video.countDocuments(filter)
    
    return res.status(200).json(
        new ApiResponse(200, {
            videos: populatedVideos,
            pagination: {
                totalVideos,
                totalPages: Math.ceil(totalVideos / limit),
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        }, "Videos fetched successfully")
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    
    if (!title?.trim()) {
        throw new ApiError(400, "Video title is required")
    }
    
    if (!description?.trim()) {
        throw new ApiError(400, "Video description is required")
    }
    
    if (!req.files?.video) {
        throw new ApiError(400, "Video file is required")
    }
    
    const videoFile = req.files.video[0]
    const videoUploadResult = await uploadOnCloudinary(videoFile.path)
    
    if (!videoUploadResult?.url) {
        throw new ApiError(400, "Error while uploading video")
    }
    
    const video = await Video.create({
        title: title.trim(),
        description: description.trim(),
        videoFile: {
            url: videoUploadResult.url,
            publicId: videoUploadResult.public_id,
            duration: videoUploadResult.duration || 0,
            format: videoUploadResult.format
        },
        thumbnail: {
            url: videoUploadResult.thumbnails?.[0]?.url || ""
        },
        owner: new mongoose.Types.ObjectId(req.user?._id)
    })
    
    // Explicitly fetch owner details using User model
    const owner = await User.findById(req.user?._id).select("fullName username avatar")
    
    const populatedVideo = {
        ...video.toObject(),
        owner: owner
    }
    
    return res.status(201).json(
        new ApiResponse(201, populatedVideo, "Video uploaded successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    
    const video = await Video.findById(videoId)
    
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    
    // Explicitly fetch owner details using User model instead of populate
    const owner = await User.findById(video.owner).select("fullName username avatar")
    
    const videoWithOwner = {
        ...video.toObject(),
        owner: owner
    }
    
    return res.status(200).json(
        new ApiResponse(200, videoWithOwner, "Video fetched successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    
    if (!title?.trim() && !description?.trim()) {
        throw new ApiError(400, "At least one field (title or description) is required to update")
    }
    
    const video = await Video.findById(videoId)
    
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    
    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You can only update your own videos")
    }
    
    const updateFields = {}
    if (title?.trim()) {
        updateFields.title = title.trim()
    }
    if (description?.trim()) {
        updateFields.description = description.trim()
    }
    
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateFields },
        { new: true }
    )
    
    // Explicitly fetch updated owner details
    const owner = await User.findById(updatedVideo.owner).select("fullName username avatar")
    const videoWithOwner = {
        ...updatedVideo.toObject(),
        owner: owner
    }
    
    return res.status(200).json(
        new ApiResponse(200, videoWithOwner, "Video updated successfully")
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    
    const video = await Video.findById(videoId)
    
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    
    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You can only delete your own videos")
    }
    
    await Video.findByIdAndDelete(videoId)
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Video deleted successfully")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    
    const video = await Video.findById(videoId)
    
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    
    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You can only modify publish status of your own videos")
    }
    
    video.isPublished = !video.isPublished
    await video.save()
    
    // Explicitly fetch owner details for the response
    const owner = await User.findById(video.owner).select("fullName username avatar")
    const videoWithOwner = {
        ...video.toObject(),
        owner: owner
    }
    
    return res.status(200).json(
        new ApiResponse(200, videoWithOwner, "Video publish status toggled successfully")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}