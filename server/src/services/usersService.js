const User = require("../models/User");
const { VALID_USER_ROLES } = require("../constants/userRoles");
const { ERROR_MESSAGES } = require("../constants/messages");

/**
 * Get all users with pagination and filtering
 */
async function getUsers({ page = 1, limit = 20, search = "", role = "" } = {}) {
  const skip = (page - 1) * limit;

  // Build query
  const query = {};
  if (search) {
    query.$or = [
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
    ];
  }
  if (role) {
    query.role = role;
  }

  // Get users and total count
  const [users, total] = await Promise.all([
    User.find(query).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(query),
  ]);

  return {
    users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get user by ID
 */
async function getUserById(userId) {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

/**
 * Update user (admin only)
 */
async function updateUser(userId, updateData) {
  const allowedFields = ["firstName", "lastName", "bio", "avatar", "role", "isVerified"];
  const updateFields = {};

  // Only allow updating specific fields
  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      updateFields[field] = updateData[field];
    }
  });

  // Validate role if provided
  if (updateFields.role && !VALID_USER_ROLES.includes(updateFields.role)) {
    throw new Error(ERROR_MESSAGES.INVALID_ROLE);
  }

  const user = await User.findByIdAndUpdate(userId, updateFields, { new: true, runValidators: true }).select(
    "-password"
  );

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

/**
 * Create user (admin only)
 */
async function createUser(userData) {
  const { username, email, password, firstName, lastName, bio, avatar, role, isVerified } = userData;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw new Error("User with this email or username already exists");
  }

  // Validate role if provided
  if (role && !VALID_USER_ROLES.includes(role)) {
    throw new Error(ERROR_MESSAGES.INVALID_ROLE);
  }

  // Create new user
  const user = new User({
    username,
    email,
    password: password || "TempPassword123!", // Default password if not provided
    firstName,
    lastName,
    bio,
    avatar,
    role: role || "user",
    isVerified: isVerified || false,
  });

  await user.save();

  // Return user without password
  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
}

/**
 * Delete user (admin only)
 */
async function deleteUser(userId) {
  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    throw new Error("User not found");
  }
  return { message: "User deleted successfully" };
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
