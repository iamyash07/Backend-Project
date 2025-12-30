import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    videoFile: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      duration: { type: Number, required: true },
      format: { type: String, required: true },
    },

    thumbnail: {
      url: { type: String, default: "" },
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    views: {
      type: Number,
      default: 0,
    },

    isPublished: {
      type: Boolean,
      default: true,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

//  virtual properties to flatten nested fields
videoSchema.virtual('duration').get(function () {
  return this.videoFile?.duration || 0;
});

videoSchema.virtual('videoUrl').get(function () {
  return this.videoFile?.url || '';
});

videoSchema.virtual('thumbnailUrl').get(function () {
  return this.thumbnail?.url || '';
});

// Ensure virtuals are included when converting to JSON/Object
videoSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    // Also flatten the nested properties directly for easier access
    ret.duration = ret.videoFile?.duration || 0;
    ret.thumbnail = ret.thumbnail?.url || '';
    ret.videoFile = ret.videoFile?.url || '';
    return ret;
  }
});

videoSchema.set('toObject', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.duration = ret.videoFile?.duration || 0;
    ret.thumbnail = ret.thumbnail?.url || '';
    ret.videoFile = ret.videoFile?.url || '';
    return ret;
  }
});

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
