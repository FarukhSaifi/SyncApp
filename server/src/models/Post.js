const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [500, "Title cannot exceed 500 characters"],
    },
    content_markdown: {
      type: String,
      required: [true, "Content is required"],
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
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
postSchema.index({ status: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ title: "text", content_markdown: "text" });
postSchema.index({ tags: 1 });

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
