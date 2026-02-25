import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../utils/auth';
import * as usersController from '../controllers/usersController';

const router: Router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// POST /api/users - Create new user (admin only)
router.post('/', usersController.createUser);

// GET /api/users - Get all users with pagination and filtering
router.get('/', usersController.getUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', usersController.getUserById);

// PUT /api/users/:id - Update user
router.put('/:id', usersController.updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', usersController.deleteUser);

export default router;
