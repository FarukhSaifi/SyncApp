/**
 * Request validation middleware using Joi
 * Provides schema-based validation for requests
 */

const Joi = require("joi");
const { ValidationError } = require("./errorHandler");

// Validation wrapper
function validate(schema) {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false, // Return all errors
      allowUnknown: true, // Allow unknown keys that will be stripped
      stripUnknown: { objects: true }, // Remove unknown keys
    };

    const { error, value } = schema.validate(req.body, validationOptions);

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return next(new ValidationError("Validation failed", errors));
    }

    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
}

// Query validation
function validateQuery(schema) {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: { objects: true },
    };

    const { error, value } = schema.validate(req.query, validationOptions);

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return next(new ValidationError("Query validation failed", errors));
    }

    req.query = value;
    next();
  };
}

// Common schemas
const schemas = {
  // Post schemas
  createPost: Joi.object({
    title: Joi.string().required().max(500).trim(),
    content_markdown: Joi.string().required().trim(),
    status: Joi.string().valid("draft", "published", "archived").default("draft"),
    tags: Joi.array().items(Joi.string().trim()).default([]),
    cover_image: Joi.string().uri().allow("").optional(),
    canonical_url: Joi.string().uri().allow("").optional(),
  }),

  updatePost: Joi.object({
    title: Joi.string().max(500).trim().optional(),
    content_markdown: Joi.string().trim().optional(),
    status: Joi.string().valid("draft", "published", "archived").optional(),
    tags: Joi.array().items(Joi.string().trim()).optional(),
    cover_image: Joi.string().uri().allow("").optional(),
    canonical_url: Joi.string().uri().allow("").optional(),
  }),

  // Credential schemas
  upsertCredential: Joi.object({
    api_key: Joi.string().required().trim(),
    site_url: Joi.string().uri().optional().trim(),
    platform_config: Joi.object({
      devto_username: Joi.string().trim().optional(),
      medium_user_id: Joi.string().trim().optional(),
      wordpress_url: Joi.string().uri().optional(),
    }).optional(),
  }),

  // Publish schema
  publish: Joi.object({
    postId: Joi.string().required().trim(),
  }),

  // Auth schemas
  register: Joi.object({
    username: Joi.string().required().alphanum().min(3).max(30).trim(),
    email: Joi.string().required().email().lowercase().trim(),
    password: Joi.string().required().min(6).max(128),
    firstName: Joi.string().max(100).trim().optional(),
    lastName: Joi.string().max(100).trim().optional(),
  }),

  login: Joi.object({
    email: Joi.string().required().email().lowercase().trim(),
    password: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).trim().optional(),
    email: Joi.string().email().lowercase().trim().optional(),
    firstName: Joi.string().max(100).trim().optional(),
    lastName: Joi.string().max(100).trim().optional(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().required().min(6).max(128),
  }),

  // Query schemas
  getPosts: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid("draft", "published", "archived").optional(),
  }),
};

module.exports = {
  validate,
  validateQuery,
  schemas,
};

