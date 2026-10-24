export interface UserRoleOption {
  value: string;
  label: string;
}

export interface UseUsersOptions {
  userRole?: string;
}

export interface AddUserForm {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  isVerified: boolean;
}

export interface EditUserForm {
  role: string;
  isVerified: boolean;
}
