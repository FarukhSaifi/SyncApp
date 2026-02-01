const mongoose = require("mongoose");
const createSlug = require("slugify");
const { v4: uuidv4 } = require("uuid");
const { STRING_LIMITS, NUMERIC_LIMITS, VALID_POST_STATUS, POST_STATUS } = require("../constants");

const postSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: false,
      unique: true,
      index: true,
      trim: true,
    },
    // User ownership
    author: {
      type: mongoose.Schema.Types.ObjectId,
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
    // Multi-platform publishing status
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
    // Tags for DEV.to and other platforms
    tags: [String],
    // Cover image URL
    cover_image: String,
    // Canonical URL (original source)
    canonical_url: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
postSchema.index({ author: 1, status: 1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ status: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ title: "text", content_markdown: "text" });
postSchema.index({ tags: 1 });

// Generate a unique slug from title (or reuse existing slug)
async function generateUniqueSlug(doc) {
  const base =
    createSlug(doc.title || "untitled-post", {
      lower: true,
      strict: true,
      trim: true,
      locale: "en",
    }).slice(0, STRING_LIMITS.POST_SLUG_MAX) || "untitled-post";

  let candidate = base;
  let suffix = 2;

  // Ensure uniqueness; exclude current doc id when updating
  // Try a few friendly suffixes before falling back to uuid segment
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

postSchema.pre("validate", async function () {
  if (!this.isModified("title") && this.slug) return;
  this.slug = await generateUniqueSlug(this);
});

// Virtual for formatted dates
postSchema.virtual("created_at").get(function () {
  return this.createdAt;
});

postSchema.virtual("updated_at").get(function () {
  return this.updatedAt;
});

// Virtual for checking if post is published anywhere
postSchema.virtual("is_published_anywhere").get(function () {
  return Object.values(this.platform_status).some((platform) => platform.published);
});

module.exports = mongoose.model("Post", postSchema);
