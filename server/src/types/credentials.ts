/**
 * Credential domain types.
 */
export interface ICredential {
  _id: string;
  author: string;
  platform_name: string;
  api_key?: string;
  site_url?: string;
  is_active?: boolean;
  refresh_token?: string;
  token_expires_at?: Date;
  platform_config?: {
    devto_username?: string;
    medium_user_id?: string;
    wordpress_url?: string;
    linkedin_person_urn?: string;
  };
}

export interface UpsertCredentialRequest {
  api_key: string;
  site_url?: string;
  platform_config?: Record<string, unknown>;
}
