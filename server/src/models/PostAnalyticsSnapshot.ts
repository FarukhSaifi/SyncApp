import type { IPostAnalyticsSnapshotDocument } from "@types";
import mongoose, { Model, Schema } from "mongoose";

import { ANALYTICS_PLATFORMS } from "@constants/analytics";
import { ANALYTICS_SNAPSHOT_INDEXES } from "@constants/indexes";

export type { IPostAnalyticsSnapshot, IPostAnalyticsSnapshotDocument } from "@types";

const VALID_ANALYTICS_PLATFORMS = Object.freeze(Object.values(ANALYTICS_PLATFORMS));

const postAnalyticsSnapshotSchema = new Schema<IPostAnalyticsSnapshotDocument>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    platform: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      enum: VALID_ANALYTICS_PLATFORMS,
    },
    remote_post_id: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
      default: "",
    },
    url: {
      type: String,
      trim: true,
      default: "",
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    reactions: {
      type: Number,
      default: 0,
      min: 0,
    },
    comments: {
      type: Number,
      default: 0,
      min: 0,
    },
    as_of: {
      type: Date,
      required: true,
    },
    fetched_at: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

postAnalyticsSnapshotSchema.index(ANALYTICS_SNAPSHOT_INDEXES.POST_PLATFORM_UNIQUE, { unique: true });
postAnalyticsSnapshotSchema.index(ANALYTICS_SNAPSHOT_INDEXES.AUTHOR_PLATFORM_VIEWS);

export const PostAnalyticsSnapshot: Model<IPostAnalyticsSnapshotDocument> =
  mongoose.models.PostAnalyticsSnapshot ||
  mongoose.model<IPostAnalyticsSnapshotDocument>("PostAnalyticsSnapshot", postAnalyticsSnapshotSchema);

export default PostAnalyticsSnapshot;
