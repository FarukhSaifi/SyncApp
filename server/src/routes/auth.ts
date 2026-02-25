import { Router } from 'express';
import type { Request, Response } from 'express';
import User from '../models/User';
import { generateToken, authenticateToken } from '../utils/auth';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES, FIELDS } from '../constants';
import { createLogger } from '../utils/logger';

const router: Router = Router();
const logger = createLogger('AUTH');

// User registration
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, firstName, lastName } = req.body as {
      username: string;
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    };

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: ERROR_MESSAGES.USER_ALREADY_EXISTS,
      });
      return;
    }

    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
    });

    await user.save();

    const token = generateToken(user._id.toString());

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
    logger.error(ERROR_MESSAGES.REGISTRATION_ERROR_LOG, error as Error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.REGISTRATION_FAILED,
      details: (error as Error).message,
    });
  }
});

// User login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await User.findOne({ email });
    if (!user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: ERROR_MESSAGES.INVALID_EMAIL_OR_PASSWORD,
      });
      return;
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: ERROR_MESSAGES.INVALID_EMAIL_OR_PASSWORD,
      });
      return;
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id.toString());

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
    logger.error(ERROR_MESSAGES.LOGIN_ERROR_LOG, error as Error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.LOGIN_FAILED,
      details: (error as Error).message,
    });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.userId).select(FIELDS.USER_FIELDS.SELECT_WITHOUT_PASSWORD);

    if (!user) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: ERROR_MESSAGES.USER_NOT_FOUND,
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error(ERROR_MESSAGES.GET_PROFILE_ERROR_LOG, error as Error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.FAILED_TO_GET_PROFILE,
      details: (error as Error).message,
    });
  }
});

// Update user profile
router.put('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, bio, avatar } = req.body as {
      firstName?: string;
      lastName?: string;
      bio?: string;
      avatar?: string;
    };

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: ERROR_MESSAGES.USER_NOT_FOUND,
      });
      return;
    }

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
    logger.error(ERROR_MESSAGES.UPDATE_PROFILE_ERROR_LOG, error as Error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.FAILED_TO_UPDATE_PROFILE,
      details: (error as Error).message,
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: ERROR_MESSAGES.USER_NOT_FOUND,
      });
      return;
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: ERROR_MESSAGES.CURRENT_PASSWORD_INCORRECT,
      });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: SUCCESS_MESSAGES.PASSWORD_CHANGED,
    });
  } catch (error) {
    logger.error(ERROR_MESSAGES.CHANGE_PASSWORD_ERROR_LOG, error as Error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.FAILED_TO_CHANGE_PASSWORD,
      details: (error as Error).message,
    });
  }
});

export default router;
