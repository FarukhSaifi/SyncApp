import mongoose, { Schema, Document, Model } from 'mongoose';
import { VALID_PLATFORMS, PLATFORMS, NUMERIC_LIMITS } from '../constants';
import type { ICredential } from '../types/index';

export interface ICredentialDocument extends Document, Omit<ICredential, '_id'> {
  platform_name: string;
  api_key: string;
  site_url?: string;
  user_id?: number;
  is_active: boolean;
  platform_config?: {
    devto_username?: string;
    medium_user_id?: string;
    wordpress_url?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  created_at: Date;
  updated_at: Date;
}

const credentialSchema = new Schema<ICredentialDocument>(
  {
    platform_name: {
      type: String,
      required: [true, 'Platform name is required'],
      unique: true,
      trim: true,
      lowercase: true,
      enum: VALID_PLATFORMS,
    },
    api_key: {
      type: String,
      required: [true, 'API key is required'],
    },
    site_url: {
      type: String,
      trim: true,
      required: function (this: ICredentialDocument): boolean {
        return this.platform_name === PLATFORMS.WORDPRESS;
      },
    },
    user_id: {
      type: Number,
      default: NUMERIC_LIMITS.DEFAULT_USER_ID,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    platform_config: {
      devto_username: String,
      medium_user_id: String,
      wordpress_url: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

credentialSchema.index({ user_id: 1 });
credentialSchema.index({ is_active: 1 });

credentialSchema.virtual('created_at').get(function (this: ICredentialDocument) {
  return this.createdAt;
});

credentialSchema.virtual('updated_at').get(function (this: ICredentialDocument) {
  return this.updatedAt;
});

const Credential: Model<ICredentialDocument> = mongoose.model<ICredentialDocument>('Credential', credentialSchema);

export default Credential;
