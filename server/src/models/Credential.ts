import mongoose, { Document, Model, Schema, type Types } from "mongoose";
import { PLATFORMS, VALID_PLATFORMS } from "../constants";
import { CREDENTIAL_INDEXES } from "../constants/indexes";
import type { ICredential } from "../types/index";

export interface ICredentialDocument extends Document, Omit<ICredential, "_id" | "author" | "token_expires_at"> {
  author: Types.ObjectId;
  platform_name: string;
  encrypted_payload: string; // Packed as IV:TAG:CIPHERTEXT
  api_key: string;           // Backward-compatible alias
  site_url?: string;
  is_active: boolean;
  refresh_token?: string;
  token_expires_at?: Date;
  platform_config?: {
    devto_username?: string;
    medium_user_id?: string;
    wordpress_url?: string;
    linkedin_person_urn?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  created_at: Date;
  updated_at: Date;
}

const credentialSchema = new Schema<ICredentialDocument>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
      index: true,
    },
    platform_name: {
      type: String,
      required: [true, "Platform name is required"],
      trim: true,
      lowercase: true,
      enum: VALID_PLATFORMS,
    },
    encrypted_payload: {
      type: String,
      required: function (this: ICredentialDocument): boolean {
        return !this.api_key;
      },
    },
    api_key: {
      type: String,
      required: function (this: ICredentialDocument): boolean {
        return !this.encrypted_payload;
      },
    },
    site_url: {
      type: String,
      trim: true,
      default: null,
      required: function (this: ICredentialDocument): boolean {
        return this.platform_name === PLATFORMS.WORDPRESS;
      },
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    refresh_token: {
      type: String,
    },
    token_expires_at: {
      type: Date,
    },
    platform_config: {
      devto_username: String,
      medium_user_id: String,
      wordpress_url: String,
      linkedin_person_urn: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Synchronize encrypted_payload and api_key before validation
credentialSchema.pre("validate", function (this: ICredentialDocument) {
  if (this.encrypted_payload && !this.api_key) {
    this.api_key = this.encrypted_payload;
  } else if (this.api_key && !this.encrypted_payload) {
    this.encrypted_payload = this.api_key;
  }
});

// Compound unique index ensuring one credential per platform per author
credentialSchema.index({ author: 1, platform_name: 1 }, { unique: true });
credentialSchema.index(CREDENTIAL_INDEXES.AUTHOR_ACTIVE);

credentialSchema.virtual("created_at").get(function (this: ICredentialDocument) {
  return this.createdAt;
});

credentialSchema.virtual("updated_at").get(function (this: ICredentialDocument) {
  return this.updatedAt;
});

export const Credential: Model<ICredentialDocument> = mongoose.model<ICredentialDocument>(
  "Credential",
  credentialSchema,
);

export default Credential;
