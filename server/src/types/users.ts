/**
 * User domain and query parameter types.
 */
export interface IUser {
  _id: string;
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  isVerified?: boolean;
  role: "user" | "admin";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GetUsersParams {
  page?: number | string;
  limit?: number | string;
  search?: string;
  role?: string;
  isVerified?: boolean | string;
}

export interface CreateUserData {
  username: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  role?: string;
  isVerified?: boolean;
}
