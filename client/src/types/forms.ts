/**
 * Form states and payloads across SyncApp client views.
 */

export interface ProfileFormState extends Record<string, unknown> {
  firstName: string;
  lastName: string;
  bio: string;
  avatar: string;
}

export interface PasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RegisterFormState {
  [key: string]: string;
}

export interface AddUserForm extends Record<string, unknown> {
  username: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  role: string;
  isVerified: boolean;
}

export interface EditForm extends Record<string, unknown> {
  role: string;
  isVerified: boolean;
}

export interface LoginFormState {
  [key: string]: string;
}

export interface SavedState {
  medium: boolean;
  devto: boolean;
  wordpress: boolean;
  linkedin: boolean;
}
