import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    

    if(!name?.trim()){
        throw new ApiError(400, " Playlist name is required")
    }

    const playlist = await Playlist.create({
        name: name.trim(),
        description: description?.trim(),
        owner: req.user?._id
    })

    const populatedPlaylist = await Playlist.aggregate([
        {$match: { _id: playlist._id} },
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
                name: 1,
                description: 1,
                videos: 1,
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
        }
    ])
    return res.status(201).json(
        new ApiResponse(201, populatedPlaylist[0], "Playlist created successfully")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
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
        { $unwind: "$ownerDetails" },
        {
            $project: {
                name: 1,
                description: 1,
                videos: 1,
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
        { $sort: { createdAt: -1 } }
    ])

    return res.status(200).json(
        new ApiResponse(200, playlists, "User playlists retrieved successfully")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    const playlist = await Playlist.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(playlistId) } },
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
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videosDetails"
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                videos: 1,
                owner: 1,
                ownerDetails: {
                    _id: 1,
                    fullName: 1,
                    username: 1,
                    avatar: 1
                },
                videosDetails: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ])

    if (!playlist.length) {
        throw new ApiError(404, "Playlist not found")
    }

    return res.status(200).json(
        new ApiResponse(200, playlist[0], "Playlist retrieved successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist ID or video ID")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (!playlist.owner.equals(req.user?._id)) {
        throw new ApiError(403, "Unauthorized to modify this playlist")
    }

    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video is already in the playlist")
    }

    playlist.videos.push(videoId)
    await playlist.save()

    const populatedPlaylist = await Playlist.aggregate([
        { $match: { _id: playlist._id } },
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
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videosDetails"
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                videos: 1,
                owner: 1,
                ownerDetails: {
                    _id: 1,
                    fullName: 1,
                    username: 1,
                    avatar: 1
                },
                videosDetails: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, populatedPlaylist[0], "Video removed from playlist successfully")
    )
})


const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    
    if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid playlist ID or video ID")
    }

    // Find the playlist
    const playlist = await Playlist.findById(playlistId)
    
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    // Check ownership
    if (!playlist.owner.equals(req.user?._id)) {
        throw new ApiError(403, "Unauthorized to modify this playlist")
    }

    // Check if the video exists in the playlist
    const videoIndex = playlist.videos.indexOf(videoId)
    if (videoIndex === -1) {
        throw new ApiError(400, "Video is not present in this playlist")
    }

    // Remove the video from the playlist
    playlist.videos.splice(videoIndex, 1)
    await playlist.save()

    return res.status(200).json(
        new ApiResponse(200, {}, "Video removed from playlist successfully")
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (!playlist.owner.equals(req.user?._id)) {
        throw new ApiError(403, "Unauthorized to delete this playlist")
    }

    await Playlist.findByIdAndDelete(playlistId)

    return res.status(200).json(
        new ApiResponse(200, {}, "Playlist deleted successfully")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
   
    if (!name?.trim()) {
        throw new ApiError(400, "Playlist name is required")
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (!playlist.owner.equals(req.user?._id)) {
        throw new ApiError(403, "Unauthorized to update this playlist")
    }

    const updateFields = {}
    
    if (name?.trim()) {
        updateFields.name = name.trim()
    }
    
    if (description !== undefined) {
        updateFields.description = description?.trim()
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: updateFields
        },
        {
            new: true,
            runValidators: true
        }
    )

    const populatedPlaylist = await Playlist.aggregate([
        { $match: { _id: updatedPlaylist._id } },
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
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videosDetails"
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                videos: 1,
                owner: 1,
                ownerDetails: {
                    _id: 1,
                    fullName: 1,
                    username: 1,
                    avatar: 1
                },
                videosDetails: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, populatedPlaylist[0], "Playlist updated successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}