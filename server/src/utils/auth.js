const jwt = require("jsonwebtoken");
const { config } = require("../config");
const { ERROR_MESSAGES } = require("../constants/messages");
const { USER_ROLES } = require("../constants/userRoles");
const HTTP_STATUS = require("../constants/httpStatus");
const HTTP_CONSTANTS = require("../constants/http");
const { logger } = require("./logger");

const BEARER_PREFIX = `${HTTP_CONSTANTS.AUTH_SCHEMES.BEARER} `;

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
};

// Extract token from Authorization header
const extractToken = (req) => {
  const authHeader = req.headers[HTTP_CONSTANTS.HEADERS.AUTHORIZATION.toLowerCase()];
  if (authHeader && authHeader.startsWith(BEARER_PREFIX)) {
    return authHeader.substring(BEARER_PREFIX.length);
  }
  return null;
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: ERROR_MESSAGES.ACCESS_TOKEN_REQUIRED,
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: ERROR_MESSAGES.INVALID_OR_EXPIRED_TOKEN,
    });
  }

  req.userId = decoded.userId;
  next();
};

// Optional authentication middleware (for public routes)
const optionalAuth = (req, res, next) => {
  const token = extractToken(req);

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.userId = decoded.userId;
    }
  }

  next();
};

// Admin authorization middleware (must be used after authenticateToken)
const requireAdmin = async (req, res, next) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.userId).select("role");

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }

    if (user.role !== USER_ROLES.ADMIN) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: ERROR_MESSAGES.ADMIN_ACCESS_REQUIRED,
      });
    }

    next();
  } catch (error) {
    logger.error(ERROR_MESSAGES.ADMIN_CHECK_ERROR_LOG, error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.FAILED_TO_VERIFY_ADMIN,
      details: error.message,
    });
  }
};

module.exports = {
  generateToken,
  verifyToken,
  extractToken,
  authenticateToken,
  optionalAuth,
  requireAdmin,
};
