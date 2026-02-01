const mongoose = require("mongoose");
const { VALID_PLATFORMS, PLATFORMS, NUMERIC_LIMITS } = require("../constants");

const credentialSchema = new mongoose.Schema(
  {
    platform_name: {
      type: String,
      required: [true, "Platform name is required"],
      unique: true,
      trim: true,
      lowercase: true,
      enum: VALID_PLATFORMS,
    },
    api_key: {
      type: String,
      required: [true, "API key is required"],
    },
    site_url: {
      type: String,
      trim: true,
      // Only required for WordPress
      required: function () {
        return this.platform_name === PLATFORMS.WORDPRESS;
      },
    },
    user_id: {
      type: Number,
      default: NUMERIC_LIMITS.DEFAULT_USER_ID,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    platform_config: {
      // Platform-specific configuration
      devto_username: String, // DEV.to username for the API
      medium_user_id: String, // Medium user ID
      wordpress_url: String, // WordPress site URL (legacy support)
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
credentialSchema.index({ user_id: 1 });
credentialSchema.index({ is_active: 1 });

// Virtual for formatted dates
credentialSchema.virtual("created_at").get(function () {
  return this.createdAt;
});

credentialSchema.virtual("updated_at").get(function () {
  return this.updatedAt;
});

module.exports = mongoose.model("Credential", credentialSchema);
