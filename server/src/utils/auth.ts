import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { ERROR_MESSAGES } from '../constants/messages';
import { USER_ROLES } from '../constants/userRoles';
import { HTTP_STATUS } from '../constants/httpStatus';
import { HTTP } from '../constants/http';
import { logger } from './logger';
import type { JwtPayload } from '../types/index';

const BEARER_PREFIX = `${HTTP.AUTH_SCHEMES.BEARER} `;

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
  });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, config.jwtSecret as string) as JwtPayload;
  } catch {
    return null;
  }
};

export const extractToken = (req: Request): string | null => {
  const authHeader = req.headers[HTTP.HEADERS.AUTHORIZATION.toLowerCase()];
  if (typeof authHeader === 'string' && authHeader.startsWith(BEARER_PREFIX)) {
    return authHeader.substring(BEARER_PREFIX.length);
  }
  return null;
};

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = extractToken(req);

  if (!token) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: ERROR_MESSAGES.ACCESS_TOKEN_REQUIRED,
    });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: ERROR_MESSAGES.INVALID_OR_EXPIRED_TOKEN,
    });
    return;
  }

  req.userId = decoded.userId;
  next();
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = extractToken(req);

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.userId = decoded.userId;
    }
  }

  next();
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Dynamic import to avoid circular dependency
    const User = (await import('../models/User')).default;
    const user = await User.findById(req.userId).select('role');

    if (!user) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: ERROR_MESSAGES.USER_NOT_FOUND,
      });
      return;
    }

    if (user.role !== USER_ROLES.ADMIN) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: ERROR_MESSAGES.ADMIN_ACCESS_REQUIRED,
      });
      return;
    }

    next();
  } catch (error) {
    logger.error(ERROR_MESSAGES.ADMIN_CHECK_ERROR_LOG, error as Error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.FAILED_TO_VERIFY_ADMIN,
      details: (error as Error).message,
    });
  }
};
