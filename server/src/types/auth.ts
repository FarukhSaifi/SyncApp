/**
 * Authentication and authorization types and request DTOs.
 */
export interface JwtPayload {
  userId: string;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export type LinkedInAccessContext = {
  accessToken: string;
  expiresInSeconds?: number;
  refreshToken?: string;
  personUrn: string;
};

export interface RegisterRequestBody {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface UpdateProfileRequestBody {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
}

export interface ChangePasswordRequestBody {
  currentPassword: string;
  newPassword: string;
}
