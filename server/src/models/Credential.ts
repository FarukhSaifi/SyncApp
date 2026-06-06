import mongoose, { Document, Model, Schema } from "mongoose";
import { PLATFORMS, VALID_PLATFORMS } from "../constants";
import { CREDENTIAL_INDEXES } from "../constants/indexes";
import type { ICredential } from "../types/index";

export interface ICredentialDocument extends Document, Omit<ICredential, "_id" | "author"> {
  author: mongoose.Types.ObjectId;
  platform_name: string;
  api_key: string;
  site_url?: string;
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
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
    },
    platform_name: {
      type: String,
      required: [true, "Platform name is required"],
      trim: true,
      lowercase: true,
      enum: VALID_PLATFORMS,
    },
    api_key: {
      type: String,
      required: [true, "API key is required"],
    },
    site_url: {
      type: String,
      trim: true,
      required: function (this: ICredentialDocument): boolean {
        return this.platform_name === PLATFORMS.WORDPRESS;
      },
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
  },
);

credentialSchema.index(CREDENTIAL_INDEXES.AUTHOR_PLATFORM_UNIQUE, { unique: true });
credentialSchema.index(CREDENTIAL_INDEXES.AUTHOR_ACTIVE);

credentialSchema.virtual("created_at").get(function (this: ICredentialDocument) {
  return this.createdAt;
});

credentialSchema.virtual("updated_at").get(function (this: ICredentialDocument) {
  return this.updatedAt;
});

const Credential: Model<ICredentialDocument> = mongoose.model<ICredentialDocument>("Credential", credentialSchema);

export default Credential;
