const express = require("express");
const User = require("../models/User");
const { generateToken, authenticateToken } = require("../utils/auth");
const { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } = require("../constants");
const router = express.Router();

// User registration
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: ERROR_MESSAGES.USER_ALREADY_EXISTS,
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      },
      message: SUCCESS_MESSAGES.REGISTRATION_SUCCESS,
    });
  } catch (error) {
    console.error(ERROR_MESSAGES.REGISTRATION_ERROR_LOG, error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.REGISTRATION_FAILED,
      details: error.message,
    });
  }
});

// User login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: ERROR_MESSAGES.INVALID_EMAIL_OR_PASSWORD,
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: ERROR_MESSAGES.INVALID_EMAIL_OR_PASSWORD,
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      },
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
    });
  } catch (error) {
    console.error(ERROR_MESSAGES.LOGIN_ERROR_LOG, error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.LOGIN_FAILED,
      details: error.message,
    });
  }
});

// Get current user profile
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const { FIELDS } = require("../constants");
    const user = await User.findById(req.userId).select(FIELDS.USER_FIELDS.SELECT_WITHOUT_PASSWORD);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(ERROR_MESSAGES.GET_PROFILE_ERROR_LOG, error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.FAILED_TO_GET_PROFILE,
      details: error.message,
    });
  }
});

// Update user profile
router.put("/me", authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, bio, avatar } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }

    // Update allowed fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      data: user,
      message: SUCCESS_MESSAGES.PROFILE_UPDATED,
    });
  } catch (error) {
    console.error(ERROR_MESSAGES.UPDATE_PROFILE_ERROR_LOG, error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.FAILED_TO_UPDATE_PROFILE,
      details: error.message,
    });
  }
});

// Change password
router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: ERROR_MESSAGES.CURRENT_PASSWORD_INCORRECT,
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: SUCCESS_MESSAGES.PASSWORD_CHANGED,
    });
  } catch (error) {
    console.error(ERROR_MESSAGES.CHANGE_PASSWORD_ERROR_LOG, error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.FAILED_TO_CHANGE_PASSWORD,
      details: error.message,
    });
  }
});

module.exports = router;
