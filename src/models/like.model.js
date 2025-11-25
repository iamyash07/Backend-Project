import mongoose, { Schema } from "mongoose"


const likeSchema = new Schema(
    {
        video: {
            type: Schema.types.OjectID,
            ref: "video"
        },
        comment: {
            type: Schema.types.OjectID,
            ref: "Comment"
        },
        tweet: {
            type: Schema.types.OjectID,
            ref: "Tweet"
        },
        likedBy: {
            type: Schema.types.OjectID,
            ref: "User"
        }
    },
    {
        timestamps: true
    })
export const Like = mongoose.model("Like", likeSchema)