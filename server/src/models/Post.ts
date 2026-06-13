import mongoose, { Document, Model, Schema } from "mongoose";
import createSlug from "slugify";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config";
import { NUMERIC_LIMITS, POST_STATUS, STRING_LIMITS, VALID_POST_STATUS } from "../constants";
import { POST_INDEXES } from "../constants/indexes";
import type { IPlatformStatus, IPost } from "../types/index";

export interface IPostDocument extends Document, Omit<IPost, "_id" | "author"> {
  author: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  created_at: Date;
  updated_at: Date;
  is_published_anywhere: boolean;
  meta_description?: string | null;
}

const postSchema = new Schema<IPostDocument>(
  {
    slug: {
      type: String,
      required: false,
      unique: true,
      trim: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [STRING_LIMITS.POST_TITLE_MAX, `Title cannot exceed ${STRING_LIMITS.POST_TITLE_MAX} characters`],
    },
    content_markdown: {
      type: String,
      required: [true, "Content is required"],
    },
    status: {
      type: String,
      enum: VALID_POST_STATUS,
      default: POST_STATUS.DRAFT,
    },
    platform_status: {
      medium: {
        published: { type: Boolean, default: false },
        post_id: String,
        url: String,
        published_at: Date,
      },
      devto: {
        published: { type: Boolean, default: false },
        post_id: String,
        url: String,
        published_at: Date,
      },
      wordpress: {
        published: { type: Boolean, default: false },
        post_id: String,
        url: String,
        published_at: Date,
      },
    },
    tags: [String],
    meta_description: {
      type: String,
      trim: true,
      maxlength: [160, "Meta description cannot exceed 160 characters"],
    },
    cover_image: String,
    canonical_url: String,
    scheduled_for: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

postSchema.index(POST_INDEXES.AUTHOR_RECENT);
postSchema.index(POST_INDEXES.PUBLIC_FEED);
postSchema.index(POST_INDEXES.SCHEDULED_PUBLISH);

async function generateUniqueSlug(doc: IPostDocument): Promise<string> {
  const base =
    createSlug(doc.title || "untitled-post", {
      lower: true,
      strict: true,
      trim: true,
      locale: "en",
    }).slice(0, STRING_LIMITS.POST_SLUG_MAX) || "untitled-post";

  let candidate = base;
  let suffix = 2;

  while (await mongoose.model("Post").exists({ slug: candidate, _id: { $ne: doc._id } })) {
    if (suffix <= NUMERIC_LIMITS.SLUG_MAX_SUFFIX_ATTEMPTS) {
      candidate = `${base}-${suffix++}`;
    } else {
      candidate = `${base}-${uuidv4().slice(0, NUMERIC_LIMITS.SLUG_UUID_LENGTH)}`;
      break;
    }
  }
  return candidate;
}

postSchema.pre("validate", async function (this: IPostDocument) {
  if (!this.isModified("title") && this.slug) return;
  this.slug = await generateUniqueSlug(this);
});

postSchema.pre("save", function (this: IPostDocument) {
  if (this.canonical_url && this.canonical_url.trim() !== "") return; // Respect custom canonical URL if set

  const base = config.canonicalBaseUrl as string | undefined;
  if (base && this.slug) {
    // Full URL: https://yourblog.com/blog/my-post-slug
    this.canonical_url = `${base}/${this.slug}`;
  } else if (this.slug) {
    // Fallback: use the slug itself so the field is never blank
    this.canonical_url = this.slug;
  } else {
    this.canonical_url = "";
  }
});

postSchema.virtual("created_at").get(function (this: IPostDocument) {
  return this.createdAt;
});

postSchema.virtual("updated_at").get(function (this: IPostDocument) {
  return this.updatedAt;
});

postSchema.virtual("is_published_anywhere").get(function (this: IPostDocument) {
  const platformStatus = this.platform_status as Record<string, IPlatformStatus> | undefined;
  if (!platformStatus) return false;
  return Object.values(platformStatus).some((platform) => platform.published);
});

const Post: Model<IPostDocument> = mongoose.model<IPostDocument>("Post", postSchema);

export default Post;
