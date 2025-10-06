const express = require("express");
const axios = require("axios");
const Post = require("../models/Post");
const Credential = require("../models/Credential");
const { decrypt } = require("../utils/encryption");

const router = express.Router();

// POST /api/publish/medium - Publish a post to Medium
router.post("/medium", async (req, res) => {
  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({
        success: false,
        error: "Post ID is required",
      });
    }

    // Get the post content from the database
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    // Get the Medium API credentials
    const credential = await Credential.findOne({ platform_name: "medium" });

    if (!credential) {
      return res.status(400).json({
        success: false,
        error:
          "Medium API credentials not found. Please configure your Medium API key in settings.",
      });
    }

    const encryptedApiKey = credential.api_key;
    const apiKey = decrypt(encryptedApiKey);

    if (!apiKey || apiKey === "your_medium_api_key_here") {
      return res.status(400).json({
        success: false,
        error: "Invalid Medium API key. Please configure your Medium API key in settings.",
      });
    }

    // For Medium API, we need to first get the user's author ID
    // This is a simplified approach - in production you might want to store this
    const userResponse = await axios.get("https://api.medium.com/v1/me", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const authorId = userResponse.data.data.id;

    // Prepare the post data for Medium
    const mediumPostData = {
      title: post.title,
      contentFormat: "markdown",
      content: post.content_markdown,
      publishStatus: "public",
    };

    // Publish to Medium
    const publishResponse = await axios.post(
      `https://api.medium.com/v1/users/${authorId}/posts`,
      mediumPostData,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Update the post status and Medium details in our database
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        status: "published",
        "platform_status.medium.published": true,
        "platform_status.medium.post_id": publishResponse.data.data.id,
        "platform_status.medium.url": publishResponse.data.data.url,
        "platform_status.medium.published_at": new Date(),
      },
      { new: true, runValidators: true }
    );

    // Return success response
    res.json({
      success: true,
      message: "Post published to Medium successfully",
      data: {
        postId: updatedPost._id,
        mediumPostId: publishResponse.data.data.id,
        mediumUrl: publishResponse.data.data.url,
        status: "published",
      },
    });
  } catch (error) {
    console.error("Error publishing to Medium:", error);

    // Handle specific Medium API errors
    if (error.response) {
      const mediumError = error.response.data;
      return res.status(error.response.status).json({
        success: false,
        error: "Medium API Error",
        details: mediumError.errors || mediumError.message || "Unknown Medium API error",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to publish to Medium",
      message: error.message,
    });
  }
});

// POST /api/publish/devto - Publish a post to DEV.to
router.post("/devto", async (req, res) => {
  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({
        success: false,
        error: "Post ID is required",
      });
    }

    // Get the post content from the database
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    // Get the DEV.to API credentials
    const credential = await Credential.findOne({ platform_name: "devto" });

    if (!credential) {
      return res.status(400).json({
        success: false,
        error:
          "DEV.to API credentials not found. Please configure your DEV.to API key in settings.",
      });
    }

    const encryptedApiKey = credential.api_key;
    const apiKey = decrypt(encryptedApiKey);

    if (!apiKey || apiKey === "your_devto_api_key_here") {
      return res.status(400).json({
        success: false,
        error: "Invalid DEV.to API key. Please configure your DEV.to API key in settings.",
      });
    }

    // Prepare the post data for DEV.to
    const devtoPostData = {
      article: {
        title: post.title,
        body_markdown: post.content_markdown,
        published: true,
        tags: post.tags || ["general"],
        cover_image: post.cover_image || null,
        canonical_url: post.canonical_url || null,
      },
    };

    // Publish to DEV.to
    const publishResponse = await axios.post("https://dev.to/api/articles", devtoPostData, {
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    // Update the post status and DEV.to details in our database
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        status: "published",
        "platform_status.devto.published": true,
        "platform_status.devto.post_id": publishResponse.data.id.toString(),
        "platform_status.devto.url": publishResponse.data.url,
        "platform_status.devto.published_at": new Date(),
      },
      { new: true, runValidators: true }
    );

    // Return success response
    res.json({
      success: true,
      message: "Post published to DEV.to successfully",
      data: {
        postId: updatedPost._id,
        devtoPostId: publishResponse.data.id,
        devtoUrl: publishResponse.data.url,
        status: "published",
      },
    });
  } catch (error) {
    console.error("Error publishing to DEV.to:", error);

    // Handle specific DEV.to API errors
    if (error.response) {
      const devtoError = error.response.data;
      return res.status(error.response.status).json({
        success: false,
        error: "DEV.to API Error",
        details: devtoError.error || devtoError.message || "Unknown DEV.to API error",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to publish to DEV.to",
      message: error.message,
    });
  }
});

// POST /api/publish/wordpress - Publish a post to WordPress
router.post("/wordpress", async (req, res) => {
  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({
        success: false,
        error: "Post ID is required",
      });
    }

    // Get the post content from the database
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    // Get the WordPress API credentials
    const credential = await Credential.findOne({ platform_name: "wordpress" });

    if (!credential) {
      return res.status(400).json({
        success: false,
        error:
          "WordPress API credentials not found. Please configure your WordPress API key in settings.",
      });
    }

    const encryptedApiKey = credential.api_key;
    const apiKey = decrypt(encryptedApiKey);

    if (!apiKey || apiKey === "your_wordpress_api_key_here") {
      return res.status(400).json({
        success: false,
        error: "Invalid WordPress API key. Please configure your WordPress API key in settings.",
      });
    }

    // Get WordPress site URL from credentials
    const siteUrl = credential.site_url || credential.additional_data?.site_url;

    if (!siteUrl) {
      return res.status(400).json({
        success: false,
        error: "WordPress site URL not configured. Please add your WordPress site URL in settings.",
      });
    }

    // Prepare the post data for WordPress
    const wordpressPostData = {
      title: post.title,
      content: post.content_markdown,
      status: "publish",
      categories: post.tags && post.tags.length > 0 ? post.tags : [],
      featured_media: post.cover_image || null,
      meta: {
        canonical_url: post.canonical_url || null,
      },
    };

    // Publish to WordPress
    const publishResponse = await axios.post(`${siteUrl}/wp-json/wp/v2/posts`, wordpressPostData, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    // Update the post status and WordPress details in our database
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        status: "published",
        "platform_status.wordpress.published": true,
        "platform_status.wordpress.post_id": publishResponse.data.id.toString(),
        "platform_status.wordpress.url": publishResponse.data.link,
        "platform_status.wordpress.published_at": new Date(),
      },
      { new: true, runValidators: true }
    );

    // Return success response
    res.json({
      success: true,
      message: "Post published to WordPress successfully",
      data: {
        postId: updatedPost._id,
        wordpressPostId: publishResponse.data.id,
        wordpressUrl: publishResponse.data.link,
        status: "published",
      },
    });
  } catch (error) {
    console.error("Error publishing to WordPress:", error);

    // Handle specific WordPress API errors
    if (error.response) {
      const wordpressError = error.response.data;
      return res.status(error.response.status).json({
        success: false,
        error: "WordPress API Error",
        details: wordpressError.message || wordpressError.error || "Unknown WordPress API error",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to publish to WordPress",
      message: error.message,
    });
  }
});

// POST /api/publish/all - Publish to all configured platforms
router.post("/all", async (req, res) => {
  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({
        success: false,
        error: "Post ID is required",
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    const results = {};
    const errors = [];

    // Get all active platform credentials
    const credentials = await Credential.find({ is_active: true });

    // Try to publish to each platform
    for (const credential of credentials) {
      try {
        if (credential.platform_name === "medium") {
          // Publish to Medium
          const mediumResult = await publishToMedium(post, credential);
          results.medium = mediumResult;
        } else if (credential.platform_name === "devto") {
          // Publish to DEV.to
          const devtoResult = await publishToDevto(post, credential);
          results.devto = devtoResult;
        } else if (credential.platform_name === "wordpress") {
          // Publish to WordPress
          const wordpressResult = await publishToWordpress(post, credential);
          results.wordpress = wordpressResult;
        }
      } catch (error) {
        errors.push({
          platform: credential.platform_name,
          error: error.message,
        });
      }
    }

    // Update post status
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        status: "published",
        ...results,
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Post published to multiple platforms",
      data: {
        postId: updatedPost._id,
        results,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error("Error publishing to multiple platforms:", error);
    res.status(500).json({
      success: false,
      error: "Failed to publish to multiple platforms",
      message: error.message,
    });
  }
});

// Helper functions for publishing
async function publishToMedium(post, credential) {
  const apiKey = decrypt(credential.api_key);
  const userResponse = await axios.get("https://api.medium.com/v1/me", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  const authorId = userResponse.data.data.id;
  const publishResponse = await axios.post(
    `https://api.medium.com/v1/users/${authorId}/posts`,
    {
      title: post.title,
      contentFormat: "markdown",
      content: post.content_markdown,
      publishStatus: "public",
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  return {
    "platform_status.medium.published": true,
    "platform_status.medium.post_id": publishResponse.data.data.id,
    "platform_status.medium.url": publishResponse.data.data.url,
    "platform_status.medium.published_at": new Date(),
  };
}

async function publishToDevto(post, credential) {
  const apiKey = decrypt(credential.api_key);
  const publishResponse = await axios.post(
    "https://dev.to/api/articles",
    {
      article: {
        title: post.title,
        body_markdown: post.content_markdown,
        published: true,
        tags: post.tags || ["general"],
        cover_image: post.cover_image || null,
        canonical_url: post.canonical_url || null,
      },
    },
    {
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
    }
  );

  return {
    "platform_status.devto.published": true,
    "platform_status.devto.post_id": publishResponse.data.id.toString(),
    "platform_status.devto.url": publishResponse.data.url,
    "platform_status.devto.published_at": new Date(),
  };
}

async function publishToWordpress(post, credential) {
  const apiKey = decrypt(credential.api_key);
  const siteUrl = credential.site_url || credential.additional_data?.site_url;

  if (!siteUrl) {
    throw new Error("WordPress site URL not configured");
  }

  const publishResponse = await axios.post(
    `${siteUrl}/wp-json/wp/v2/posts`,
    {
      title: post.title,
      content: post.content_markdown,
      status: "publish",
      categories: post.tags && post.tags.length > 0 ? post.tags : [],
      featured_media: post.cover_image || null,
      meta: {
        canonical_url: post.canonical_url || null,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  return {
    "platform_status.wordpress.published": true,
    "platform_status.wordpress.post_id": publishResponse.data.id.toString(),
    "platform_status.wordpress.url": publishResponse.data.link,
    "platform_status.wordpress.published_at": new Date(),
  };
}

// GET /api/publish/medium/status/:postId - Check publishing status
router.get("/medium/status/:postId", async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Error checking post status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check post status",
    });
  }
});

module.exports = router;
