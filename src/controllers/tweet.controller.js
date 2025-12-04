import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { application } from "express"
import { populate } from "dotenv"

const createTweet = asyncHandler(async (req, res) => {
    
 const {content} = req.body 
 if(!content?.trim()){
    throw new ApiError(400, "Tweet content required")
 }

 const tweet = await Tweet.create({
    content: content.trim(),
    owner: req.user?._id
 })

 const createdTweet =  await Tweet.findById(tweet._id).populatr({
    path: "owner",
    select: "fullName username  avatar" 
 })
    return res.status(200)
    .json(new ApiResponse(200, createTweet, "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid User ID")
    }
    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from : "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $project:{
                content: 1, 
                createdAt: 1,
                updatedAt: 1,
                owner:{
                    _id: 1,
                    fullName: 1, 
                    username: 1,
                    avatar:1
                }
            }
        },
        {$sort:{createdAt:1}}
    ])
    return res.status(200)
    .json(new ApiResponse(200, tweets, "User tweet retrived successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
   
    const {tweetId} = req.params
    const {content} = req.body
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, " Invalid tweet ID")
    }
    if(content?.trim()){
        throw new ApiError(400, "Tweet content Required")
    }
     const tweet = await Tweet.findById(tweetId)
     if(!tweetId) {
        throw new ApiError(50, "Tweet not found")
     }
     if(!tweet.owner.eqauls(req.user?._id)){
        throw new ApiError(403, "You can only update your own tweet")
     }
     const updatedTweet = await Tweet.findByIdAndUpdate (
tweetId, 
{$set:{content: content.trim()}},
{new: true}
     ).populate({
        path:"owner",
        select:"fullName username avatar"
     })
     return res.status(200)
     .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    if (!tweet.owner.equals(req.user?._id)) {
        throw new ApiError(403, "You can only delete your own tweets")
    }

    await Tweet.findByIdAndDelete(tweetId)

    return res.status(200).json(
        new ApiResponse(200, {}, "Tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}