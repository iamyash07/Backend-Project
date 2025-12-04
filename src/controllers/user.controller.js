import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessTokenAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
};

// ==================== REGISTER USER ====================
const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;

    if ([fullName, email, username, password].some(field => !field?.trim())) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (existedUser) throw new ApiError(409, "User with email or username already exists");

    console.log("REQ FILES:", req.files);

    const avatarLocalPath = req?.files?.avatar?.[0]?.path;
    console.log("Avatar Local Path:", avatarLocalPath);
    console.log("File Exists:", avatarLocalPath ? fs.existsSync(avatarLocalPath) : false);

    if (!avatarLocalPath) throw new ApiError(400, "Avatar file is required");

    const avatarUpload = await uploadOnCloudinary(avatarLocalPath);
    if (!avatarUpload?.secure_url) {
        throw new ApiError(500, "Failed to upload avatar to Cloudinary");
    }

    let coverImageUrl = "";
    const coverLocalPath = req?.files?.coverImage?.[0]?.path;

    if (coverLocalPath) {
        const coverUpload = await uploadOnCloudinary(coverLocalPath);
        coverImageUrl = coverUpload?.secure_url || "";
    }

    const user = await User.create({
        fullName,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatarUpload.secure_url,
        coverImage: coverImageUrl,
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});


// ==================== LOGIN USER ====================
const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }
    if (!password) throw new ApiError(400, "Password is required");

    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) throw new ApiError(404, "User does not exist");

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None"
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, {
            user: loggedInUser,
            accessToken,
            refreshToken
        }, "User logged in successfully"));
});

// ==================== LOGOUT  ====================
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } }, { new: true });
    const options = { httpOnly: true, secure: true, sameSite: "None" };
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incoming = req.cookies.refreshToken || req.body.refreshToken;
    if (!incoming) throw new ApiError(401, "Unauthorized");

    const decoded = jwt.verify(incoming, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded._id);
    if (!user || incoming !== user.refreshToken) throw new ApiError(401, "Invalid refresh token");

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessTokenAndRefreshTokens(user._id);
    const options = { httpOnly: true, secure: true, sameSite: "None" };

    return res
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Token refreshed"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.isPasswordCorrect(oldPassword))) throw new ApiError(400, "Old password incorrect");
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res.json(new ApiResponse(200, {}, "Password changed"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.json(new ApiResponse(200, req.user, "User fetched"));
});

const updatedAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { $set: { fullName, email } }, { new: true }).select("-password");
    return res.json(new ApiResponse(200, user, "Account updated"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, "Avatar file missing");
    const path = req.file.path || req.file.filepath;
    const avatar = await uploadOnCloudinary(path);
    if (!avatar.url) throw new ApiError(400, "Upload failed");
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: avatar.url }, { new: true }).select("-password");
    return res.json(new ApiResponse(200, user, "Avatar updated"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, "Cover image missing");
    const path = req.file.path || req.file.filepath;
    const cover = await uploadOnCloudinary(path);
    if (!cover.url) throw new ApiError(400, "Upload failed");
    const user = await User.findByIdAndUpdate(req.user._id, { coverImage: cover.url }, { new: true }).select("-password");
    return res.json(new ApiResponse(200, user, "Cover updated"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username?.trim()) throw new ApiError(400, "Username missing");

    const channel = await User.aggregate([
        { $match: { username: username.toLowerCase() } },
        {
            $lookup: { from: "subscriptions", localField: "_id", foreignField: "channel", as: "subscribers" }
        },
        {
            $lookup: { from: "subscriptions", localField: "_id", foreignField: "subscriber", as: "subscribedTo" }
        },
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" },
                channelsSubscribedToCount: { $size: "$subscribedTo" },
                isSubscribed: { $in: [req.user?._id, "$subscribers.subscriber"] }
            }
        },
        { $project: { fullName: 1, username: 1, subscribersCount: 1, channelsSubscribedToCount: 1, isSubscribed: 1, avatar: 1, coverImage: 1, email: 1 } }
    ]);

    if (!channel.length) throw new ApiError(404, "Channel not found");
    return res.json(new ApiResponse(200, channel[0], "Channel fetched"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(req.user._id) } },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [{ $project: { fullName: 1, username: 1, avatar: 1 } }]
                        }
                    },
                    { $addFields: { owner: { $first: "$owner" } } }
                ]
            }
        }
    ]);

    return res.json(new ApiResponse(200, user[0]?.watchHistory || [], "Watch history fetched"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updatedAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};