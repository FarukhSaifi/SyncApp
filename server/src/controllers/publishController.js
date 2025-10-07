const Post = require("../models/Post");
const Credential = require("../models/Credential");
const { publishToMedium, publishToDevto, publishToWordpress } = require("../services/publishService");

async function ensurePost(postId) {
  if (!postId) {
    const err = new Error("Post ID is required");
    err.status = 400;
    throw err;
  }
  const post = await Post.findById(postId);
  if (!post) {
    const err = new Error("Post not found");
    err.status = 404;
    throw err;
  }
  return post;
}

async function publishMedium(req, res) {
  try {
    const post = await ensurePost(req.body.postId);
    const credential = await Credential.findOne({ platform_name: "medium" });
    if (!credential)
      return res.status(400).json({
        success: false,
        error: "Medium API credentials not found. Please configure your Medium API key in settings.",
      });

    const updates = await publishToMedium(post, credential);
    const updatedPost = await Post.findByIdAndUpdate(
      post._id,
      { status: "published", ...updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Post published to Medium successfully",
      data: { postId: updatedPost._id, status: "published" },
    });
  } catch (error) {
    const status = error.status || (error.response && error.response.status) || 500;
    const details = error.response?.data?.errors || error.response?.data?.message;
    res.status(status).json({ success: false, error: error.message, details });
  }
}

async function publishDevto(req, res) {
  try {
    const post = await ensurePost(req.body.postId);
    const credential = await Credential.findOne({ platform_name: "devto" });
    if (!credential)
      return res.status(400).json({
        success: false,
        error: "DEV.to API credentials not found. Please configure your DEV.to API key in settings.",
      });

    const updates = await publishToDevto(post, credential);
    const updatedPost = await Post.findByIdAndUpdate(
      post._id,
      { status: "published", ...updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Post published to DEV.to successfully",
      data: { postId: updatedPost._id, status: "published" },
    });
  } catch (error) {
    const status = error.status || (error.response && error.response.status) || 500;
    const details = error.response?.data?.errors || error.response?.data?.message;
    res.status(status).json({ success: false, error: error.message, details });
  }
}

async function publishWordpress(req, res) {
  try {
    const post = await ensurePost(req.body.postId);
    const credential = await Credential.findOne({ platform_name: "wordpress" });
    if (!credential)
      return res.status(400).json({
        success: false,
        error: "WordPress API credentials not found. Please configure your WordPress API key in settings.",
      });

    const updates = await publishToWordpress(post, credential);
    const updatedPost = await Post.findByIdAndUpdate(
      post._id,
      { status: "published", ...updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Post published to WordPress successfully",
      data: { postId: updatedPost._id, status: "published" },
    });
  } catch (error) {
    const status = error.status || (error.response && error.response.status) || 500;
    const details = error.response?.data?.errors || error.response?.data?.message;
    res.status(status).json({ success: false, error: error.message, details });
  }
}

async function publishAll(req, res) {
  try {
    const post = await ensurePost(req.body.postId);
    const credentials = await Credential.find({ is_active: true });

    const results = {};
    const errors = [];

    for (const credential of credentials) {
      try {
        if (credential.platform_name === "medium") results.medium = await publishToMedium(post, credential);
        if (credential.platform_name === "devto") results.devto = await publishToDevto(post, credential);
        if (credential.platform_name === "wordpress") results.wordpress = await publishToWordpress(post, credential);
      } catch (e) {
        errors.push({ platform: credential.platform_name, error: e.message });
      }
    }

    const updatedPost = await Post.findByIdAndUpdate(
      post._id,
      { status: "published", ...results },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Post published to multiple platforms",
      data: { postId: updatedPost._id, results, errors: errors.length ? errors : undefined },
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, error: error.message });
  }
}

async function statusMedium(req, res) {
  try {
    const post = await ensurePost(req.params.postId);
    res.json({ success: true, data: post });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, error: error.message });
  }
}

module.exports = { publishMedium, publishDevto, publishWordpress, publishAll, statusMedium };
