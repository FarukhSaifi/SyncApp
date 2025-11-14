const usersService = require("../services/usersService");
const { asyncHandler } = require("../middleware/errorHandler");

/**
 * Get all users with pagination and filtering
 */
const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, search, role } = req.query;
  const result = await usersService.getUsers({ page, limit, search, role });
  res.json({ success: true, ...result });
});

/**
 * Get user by ID
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await usersService.getUserById(req.params.id);
  res.json({ success: true, data: user });
});

/**
 * Create user (admin only)
 */
const createUser = asyncHandler(async (req, res) => {
  const user = await usersService.createUser(req.body);
  res.status(201).json({ success: true, data: user, message: "User created successfully" });
});

/**
 * Update user
 */
const updateUser = asyncHandler(async (req, res) => {
  const user = await usersService.updateUser(req.params.id, req.body);
  res.json({ success: true, data: user, message: "User updated successfully" });
});

/**
 * Delete user
 */
const deleteUser = asyncHandler(async (req, res) => {
  await usersService.deleteUser(req.params.id);
  res.json({ success: true, message: "User deleted successfully" });
});

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
