import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { VALID_USER_ROLES, USER_ROLES } from '../constants/userRoles';
import { STRING_LIMITS, NUMERIC_LIMITS, REGEX_PATTERNS, VALIDATION_ERRORS } from '../constants/validation';
import type { IUser } from '../types/index';

export interface IUserDocument extends Document, Omit<IUser, '_id'> {
  lastLogin?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  toJSON(): Omit<IUserDocument, 'password'>;
}

const userSchema = new Schema<IUserDocument>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: STRING_LIMITS.USERNAME_MIN,
      maxlength: STRING_LIMITS.USERNAME_MAX,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [REGEX_PATTERNS.EMAIL, VALIDATION_ERRORS.INVALID_EMAIL],
    },
    password: {
      type: String,
      required: true,
      minlength: STRING_LIMITS.PASSWORD_MIN,
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: STRING_LIMITS.FIRST_NAME_MAX,
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: STRING_LIMITS.LAST_NAME_MAX,
    },
    bio: {
      type: String,
      maxlength: STRING_LIMITS.BIO_MAX,
    },
    avatar: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: VALID_USER_ROLES,
      default: USER_ROLES.USER,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (this: IUserDocument) {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(NUMERIC_LIMITS.BCRYPT_SALT_ROUNDS);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (this: IUserDocument, candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function (this: IUserDocument): Record<string, unknown> {
  const user = this.toObject() as Record<string, unknown>;
  delete user['password'];
  return user;
};

const User: Model<IUserDocument> = mongoose.model<IUserDocument>('User', userSchema);

export default User;
