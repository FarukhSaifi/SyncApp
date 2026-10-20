/**
 * Messages Constants
 * Centralized messages, labels, placeholders, and UI text for the entire application
 * Organized into logical sections for better maintainability
 */

// ============================================================================
// TOAST TITLES
// ============================================================================
export const TOAST_TITLES = Object.freeze({
  SUCCESS: "Success",
  ERROR: "Error",
  WARNING: "Warning",
  INFO: "Info",
  LOADING: "Loading",
  // Auth
  WELCOME_BACK: "Welcome back!",
  WELCOME: "Welcome to SyncApp!",
  LOGGED_OUT: "Logged out",
  AUTH_ERROR: "Authentication Error",
  // User Management
  USER_CREATED: "User Created",
  USER_DELETED: "User Deleted",
  USER_UPDATED: "User Updated",
  // Profile
  PROFILE_UPDATED: "Profile Updated",
  PASSWORD_CHANGED: "Password Changed",
  // Posts
  SAVED: "Saved!",
  DELETED: "Deleted!",
  PUBLISHED: "Published!",
  PUBLISHED_EVERYWHERE: "Published Everywhere!",
  // Credentials
  CREDENTIALS_SAVED: "Credentials Saved",
  CREDENTIALS_REMOVED: "Disconnected",
  CREDENTIALS_ERROR: "Credentials Error",
  // Export
  EXPORTED: "Exported!",
  // Registration
  REGISTRATION_FAILED: "Registration Failed",
  // Update
  UPDATE_FAILED: "Update Failed",
  PASSWORD_CHANGE_FAILED: "Password Change Failed",
  // Publish
  PUBLISH_FAILED: "Publish Failed",
  // Export
  EXPORT_FAILED: "Export Failed",
  // AI
  POST_GENERATED: "Post generated",
  IMAGE_GENERATED: "Image generated",
  FEATURED_IMAGE_SET: "Featured image set",
  IMAGE_UPLOADED: "Image uploaded",
  UPLOADING_IMAGE: "Uploading Image",
  UPLOAD_FAILED: "Upload Failed",
  LINKEDIN_COPIED: "LinkedIn post copied",
  LINKEDIN_SUMMARY_GENERATED: "LinkedIn summary ready",
  COPIED: "Copied",
  DOWNLOADED: "Downloaded",
  // Validation
  VALIDATION_ERROR: "Validation Error",
  // Network
  NETWORK_ERROR: "Network Error",
} as const);

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================
// Helper function to create aliases
const createSuccessMessages = () => {
  const messages = {
    // Generic
    OPERATION_COMPLETED: "Operation completed successfully!",
    // Auth
    LOGGED_OUT: "You have been successfully logged out",
    WELCOME_MESSAGE: (name: string) => `Hello ${name}!`,
    ACCOUNT_CREATED: (name: string) => `Account created successfully for ${name}!`,
    // User Management
    USER_CREATED: (username: string) => `User "${username}" has been created successfully`,
    USER_DELETED: (username: string) => `User "${username}" has been deleted successfully`,
    USER_UPDATED: (username?: string) =>
      username ? `User "${username}" has been updated successfully` : "User has been updated successfully",
    // Profile
    PROFILE_UPDATED: "Your profile has been updated successfully",
    PASSWORD_CHANGED: "Your password has been updated successfully",
    // Posts
    POST_CREATED: "Post created successfully",
    POST_UPDATED: "Post updated successfully",
    POST_DELETED: "Post deleted successfully",
    IMAGE_UPLOADED: "Image uploaded successfully",
    // AI
    AI_POST_GENERATED: "Draft added to the editor.",
    AI_LINKEDIN_SUMMARY_GENERATED: "Short LinkedIn post added to the panel.",
    AI_LINKEDIN_COPIED: "Paste it into LinkedIn when you are ready to post.",
    AI_IMAGE_GENERATED: "Preview below. Use as featured image or upload to attach.",
    AI_IMAGE_SVG_FALLBACK:
      "Image model quota hit — branded SVG cover ready. Retry later or enable AI Studio billing for real images.",
    AI_FEATURED_IMAGE_SET: "You can save the post to keep it.",
    AI_COVER_ATTACHED: "Cover image attached to this post.",
    AI_IMAGE_URL_COPIED: "Image URL copied to clipboard",
    AI_IMAGE_DOWNLOADED: "Image downloaded to your device",
    AI_EDIT_COMPLETE: "AI Edit Complete",
    // Publishing
    PUBLISHED_TO_PLATFORM: (platform: string) => `Post successfully published to ${platform}`,
    PUBLISHED_ALL: "Post published to all platforms successfully!",
    PUBLISH_PARTIAL_SUCCESS: (successes: string[], failures: string[]) =>
      failures.length > 0
        ? `Published: ${successes.join(", ")}. Failed: ${failures.join("; ")}`
        : `Published: ${successes.join(", ")}`,
    PUBLISH_ALREADY_ON_PLATFORM: (platform: string) => `Already published on ${platform}`,
    REMOVED_FROM_PLATFORM: (platform: string) => `Post removed from ${platform}`,
    // Credentials
    CREDENTIALS_SAVED: (platform: string) => `${platform} API credentials saved successfully`,
    CREDENTIALS_REMOVED: (platform: string) => `${platform} disconnected successfully`,
    // Export
    EXPORT_SUCCESS: (format: string) => `Post exported as ${format} successfully`,
    // Aliases (will be added below)
    LOGGED_OUT_SUCCESS: "" as string,
    ACCOUNT_CREATED_SUCCESS: null as null | ((name: string) => string),
    PROFILE_UPDATED_SUCCESS: "" as string,
    PASSWORD_CHANGED_SUCCESS: "" as string,
  };

  // Add aliases for backward compatibility
  messages.LOGGED_OUT_SUCCESS = messages.LOGGED_OUT;
  messages.ACCOUNT_CREATED_SUCCESS = messages.ACCOUNT_CREATED;
  messages.PROFILE_UPDATED_SUCCESS = messages.PROFILE_UPDATED;
  messages.PASSWORD_CHANGED_SUCCESS = messages.PASSWORD_CHANGED;

  return Object.freeze(messages);
};

export const SUCCESS_MESSAGES = createSuccessMessages();

// ============================================================================
// ERROR MESSAGES
// ============================================================================
export const ERROR_MESSAGES = Object.freeze({
  // Generic
  OPERATION_FAILED: "Operation failed",
  NETWORK_ERROR: "Unable to connect to server. Please check your connection.",
  NETWORK_ERROR_UNABLE_TO_CONNECT: "Network error: Unable to connect to server",
  UNEXPECTED_ERROR: "An unexpected error occurred. Please try again.",
  // Auth
  SESSION_EXPIRED: "Session expired. Please log in again.",
  INVALID_CREDENTIALS: "Invalid credentials",
  LOGIN_FAILED: "Login failed. Please try again.",
  REGISTRATION_FAILED: "Failed to create account",
  REGISTRATION_FAILED_RETRY: "Registration failed. Please try again.",
  // User Management
  FAILED_TO_LOAD_USERS: "Failed to load users",
  FAILED_TO_CREATE_USER: "Failed to create user",
  FAILED_TO_DELETE_USER: "Failed to delete user",
  FAILED_TO_UPDATE_USER: "Failed to update user",
  // Profile
  PROFILE_UPDATE_FAILED: "Failed to update profile",
  PROFILE_UPDATE_FAILED_RETRY: "Profile update failed. Please try again.",
  PASSWORD_CHANGE_FAILED: "Failed to change password",
  PASSWORD_CHANGE_FAILED_RETRY: "Password change failed. Please try again.",
  // Posts
  FAILED_TO_SAVE_POST: "Failed to save post",
  FAILED_TO_DELETE_POST: "Failed to delete post",
  FAILED_TO_FETCH_POST: "Failed to fetch post",
  FAILED_TO_FETCH_POSTS: "Failed to fetch posts",
  FAILED_TO_LOAD_POSTS: (error: string) => `Failed to load posts: ${error}`,
  FAILED_TO_LOAD_POSTS_TITLE: "Failed to load posts",
  // Publishing
  FAILED_TO_PUBLISH_TO: (platform: string) => `Failed to publish to ${platform}`,
  FAILED_TO_PUBLISH_PLATFORM: (platform: string, error: string) => `Failed to publish to ${platform}: ${error}`,
  FAILED_TO_PUBLISH_ALL: "Failed to publish to all platforms",
  FAILED_TO_UNPUBLISH: (platform: string, error: string) => `Failed to unpublish from ${platform}: ${error}`,
  // Credentials
  CREDENTIALS_SAVE_FAILED: (platform: string, error: string) => `Failed to save ${platform} credentials: ${error}`,
  CREDENTIALS_REMOVE_FAILED: (platform: string, error: string) => `Failed to disconnect ${platform}: ${error}`,
  FAILED_TO_SAVE_CREDENTIALS: "Failed to save credentials",
  FAILED_TO_REMOVE_CREDENTIALS: "Failed to disconnect platform",
  // Export
  EXPORT_FAILED: (format: string, error: string) => `Failed to export as ${format}: ${error}`,
  // Unpublish
  FAILED_TO_UNPUBLISH_PLATFORM: (platform: string, error?: string) =>
    error ? `Failed to unpublish from ${platform}: ${error}` : `Failed to unpublish from ${platform}`,
  // Uploads
  FAILED_TO_UPLOAD_IMAGE: "Failed to upload image",
  FAILED_TO_UPLOAD_DROPPED_IMAGE: "Failed to upload dropped image",
  FAILED_TO_OBTAIN_PRESIGNED_URL: "Failed to obtain presigned upload URL",
  DIRECT_CLOUD_UPLOAD_FAILED: (status: number) => `Direct cloud storage upload failed with HTTP status ${status}`,
  DOWNLOAD_BROWSER_ONLY: "Download is only supported in the browser",
  // AI
  FAILED_TO_GENERATE_POST: "Failed to generate post",
  FAILED_TO_GENERATE_IMAGE: "Failed to generate image",
  FAILED_TO_GENERATE_LINKEDIN_SUMMARY: "Failed to generate LinkedIn summary",
  AI_LINKEDIN_SUMMARY_CONTEXT_REQUIRED:
    "Add a title and article content in the editor first, then generate a LinkedIn summary.",
  FAILED_TO_UPLOAD_COVER: "Upload failed",
  FAILED_TO_COPY_LINKEDIN: "Could not copy LinkedIn post to clipboard",
  FAILED_TO_COPY_IMAGE_URL: "Failed to copy image URL to clipboard",
  FAILED_TO_DOWNLOAD_IMAGE: "Failed to download image",
  EDITOR_NOT_INITIALIZED: "Editor not initialized",
  FAILED_TO_PERFORM_AI_EDIT: "Failed to perform AI edit",
  AI_EDIT_UNKNOWN_ERROR: "Unknown error occurred",
  AI_LINKEDIN_MISSING_CANONICAL:
    "LinkedIn summary is ready, but no blog base URL is set — add CANONICAL_BASE_URL / NEXT_PUBLIC_CANONICAL_BASE_URL for a Read more link.",
} as const);

// ============================================================================
// WARNING MESSAGES
// ============================================================================
export const WARNING_MESSAGES = Object.freeze({
  // Confirmations
  DELETE_POST_CONFIRM: "Are you sure you want to delete this post?",
  DELETE_USER_CONFIRM: (username: string) =>
    `Are you sure you want to delete user "${username}"? This action cannot be undone.`,
} as const);

// ============================================================================
// VALIDATION MESSAGES
// ============================================================================
export const VALIDATION_MESSAGES = Object.freeze({
  USERNAME_EMAIL_REQUIRED: "Username and email are required",
  PASSWORDS_DO_NOT_MATCH: "New passwords do not match",
  PASSWORDS_DO_NOT_MATCH_REGISTER: "Passwords do not match",
  PASSWORD_MIN_LENGTH: "New password must be at least 6 characters long",
  PASSWORD_MIN_LENGTH_REGISTER: "Password must be at least 6 characters long",
  USERNAME_MIN_LENGTH: "Username must be at least 3 characters long",
  FILL_TITLE_AND_CONTENT: "Please fill in both title and content",
  SAVE_FIRST_BEFORE_EXPORT: "Please save the post first before exporting MDX",
  ENTER_MEDIUM_API_KEY: "Please enter your Medium API key",
  ENTER_DEVTO_CREDENTIALS: "Please enter both DEV.to API key and username",
  ENTER_WORDPRESS_CREDENTIALS: "Please enter both WordPress API key and site URL",
  VALID_WORDPRESS_URL: "Please enter a valid WordPress site URL (must start with http:// or https://)",
  // AI
  AI_KEYWORD_REQUIRED: "Enter a keyword or topic",
  AI_KEYWORD_REQUIRED_FOR_IMAGE: "Enter a keyword or topic first to generate an image.",
  AI_TARGETS_REQUIRED: "Select at least one platform to optimize for",
  EDITOR_CONTENT_OR_SELECTION_REQUIRED: "Please write something or highlight text first.",
} as const);

// ============================================================================
// LABELS - Form Labels and UI Labels
// ============================================================================
export const LABELS = Object.freeze({
  REQUIRED: "Required",
  PUBLISH_NONE: "none",
  // Form Labels - User Management & Profile
  USERNAME: "Username",
  LABEL_USERNAME: "Username",
  EMAIL: "Email",
  EMAIL_LABEL: "Email",
  PASSWORD: "Password",
  LABEL_PASSWORD: "Password",
  FIRST_NAME: "First Name",
  LABEL_FIRST_NAME: "First Name",
  LAST_NAME: "Last Name",
  LABEL_LAST_NAME: "Last Name",
  BIO: "Bio",
  LABEL_BIO: "Bio",
  AVATAR_URL: "Avatar URL",
  LABEL_AVATAR_URL: "Avatar URL",
  ROLE: "Role",
  LABEL_ROLE: "Role",
  VERIFIED: "Verified",
  LABEL_VERIFIED: "Verified",
  CURRENT_PASSWORD: "Current Password",
  NEW_PASSWORD: "New Password",
  CONFIRM_NEW_PASSWORD: "Confirm New Password",
  // Form Labels - Settings
  MEDIUM_API_KEY: "Medium Integration Token",
  MEDIUM_API_KEY_LABEL: "Medium Integration Token",
  DEVTO_USERNAME: "DEV.to Username",
  DEVTO_USERNAME_LABEL: "DEV.to Username",
  DEVTO_API_KEY: "DEV.to API Key",
  DEVTO_API_KEY_LABEL: "DEV.to API Key",
  WORDPRESS_SITE_URL: "WordPress Site URL",
  WORDPRESS_SITE_URL_LABEL: "WordPress Site URL",
  WORDPRESS_API_KEY: "WordPress API Key",
  WORDPRESS_API_KEY_LABEL: "WordPress Application Password",
  // Form Labels - Editor
  POST_TITLE: "Post Title",
  CONTENT: "Content",
  TAGS: "Tags (comma-separated)",
  TAGS_LABEL: "Tags",
  COVER_IMAGE_URL: "Cover Image URL (optional)",
  FEATURED_IMAGE_URL: "Featured Image URL",
  CANONICAL_URL_LABEL: "Canonical URL",
  CONTENT_MARKDOWN: "Content (Markdown)",
  TAB_EDIT: "Edit",
  TAB_PREVIEW: "Preview",
  // Status Labels
  UNVERIFIED: "Unverified",
  CONNECTED: "Connected",
  NOT_CONNECTED: "Not connected",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  NOT_PUBLISHED: "Not published",
  POST_STATUS_DRAFT: "Draft",
  POST_STATUS_PUBLISHED: "Published",
  POST_STATUS_ARCHIVED: "Archived",
  POST_STATUS_SCHEDULED: "Scheduled",
  // Platform Names
  PLATFORM_MEDIUM: "Medium",
  PLATFORM_DEVTO: "DEV.to",
  PLATFORM_WORDPRESS: "WordPress",
  PLATFORM_LINKEDIN: "LinkedIn",
  // Accessibility Labels
  HIDE_API_KEY: "Hide API key",
  SHOW_API_KEY: "Show API key",
  TOGGLE_PASSWORD_VISIBILITY: "Toggle password visibility",
  // Table Headers
  TABLE_TITLE: "Title",
  TABLE_STATUS: "Status",
  TABLE_TAGS: "Tags",
  TABLE_PUBLISHED_ON: "Published On",
  TABLE_CREATED: "Created At",
  TABLE_UPDATED: "Updated At",
  TABLE_SEO: "SEO",
  SEO_BADGE_LABEL: "SEO",
  SEO_SCORE_UNKNOWN: "—",
  TABLE_ACTIONS: "Actions",
  TABLE_USER: "User",
  TABLE_EMAIL: "Email",
  TABLE_ROLE: "Role",
  TABLE_JOINED: "Joined",
  TABLE_LAST_LOGIN: "Last Login",
  NEVER_LOGGED_IN: "Never",
  // Profile page aliases
  USERNAME_LABEL: "Username",
  ROLE_LABEL: "Role",
} as const);

// ============================================================================
// PLACEHOLDERS - Input Placeholders
// ============================================================================
export const PLACEHOLDERS = Object.freeze({
  // Generic
  USER: "User",
  N_A: "N/A",
  ALL_ROLES: "All Roles",
  // User Management
  SEARCH_USERS: "Search by name, email, or username...",
  PLACEHOLDER_SEARCH_USERS: "Search by name, email, or username...",
  USERNAME: "Enter username",
  PLACEHOLDER_USERNAME: "Enter username",
  EMAIL: "Enter email",
  PLACEHOLDER_EMAIL: "Enter email",
  PASSWORD: "Enter password (min 6 characters)",
  PLACEHOLDER_PASSWORD: "Enter password (min 6 characters)",
  FIRST_NAME: "Enter first name",
  PLACEHOLDER_FIRST_NAME: "Enter first name",
  LAST_NAME: "Enter last name",
  PLACEHOLDER_LAST_NAME: "Enter last name",
  BIO: "Enter bio",
  PLACEHOLDER_BIO: "Enter bio",
  AVATAR_URL: "https://example.com/avatar.jpg",
  PLACEHOLDER_AVATAR_URL: "https://example.com/avatar.jpg",
  // Profile
  FIRST_NAME_PROFILE: "First name",
  LAST_NAME_PROFILE: "Last name",
  BIO_PROFILE: "Tell us about yourself...",
  AVATAR_URL_PROFILE: "https://example.com/avatar.jpg",
  CURRENT_PASSWORD: "Enter current password",
  NEW_PASSWORD: "Enter new password",
  CONFIRM_PASSWORD: "Confirm new password",
  // Register
  CHOOSE_USERNAME: "Choose a username",
  CREATE_PASSWORD: "Create a password",
  CONFIRM_PASSWORD_REGISTER: "Confirm your password",
  // Editor
  POST_TITLE: "Enter your post title...",
  PLACEHOLDER_POST_TITLE: "Enter your post title...",
  POST_CONTENT: "Write your post content here...",
  ADD_TAG: "Add a tag...",
  TAGS: "webdev, programming, javascript, react...",
  COVER_IMAGE: "https://example.com/image.jpg",
  PLACEHOLDER_COVER_IMAGE: "https://example.com/image.jpg",
  CANONICAL_URL: "https://yourblog.com/post-slug",
  PLACEHOLDER_CANONICAL_URL: "https://yourblog.com/post-slug",
  // Settings
  MEDIUM_TOKEN: "Enter your Medium integration token...",
  PLACEHOLDER_MEDIUM_TOKEN: "Enter your Medium integration token...",
  DEVTO_USERNAME: "Enter your DEV.to username...",
  PLACEHOLDER_DEVTO_USERNAME: "Enter your DEV.to username...",
  DEVTO_API_KEY: "Enter your DEV.to API key...",
  PLACEHOLDER_DEVTO_API_KEY: "Enter your DEV.to API key...",
  WORDPRESS_SITE_URL: "https://yoursite.com",
  PLACEHOLDER_WORDPRESS_SITE_URL: "https://yoursite.com",
  WORDPRESS_API_KEY: "Enter your WordPress application password...",
  PLACEHOLDER_WORDPRESS_API_KEY: "Enter your WordPress application password...",
  SAVED_HIDDEN: "Saved (hidden) — enter new to replace",
} as const);

// ============================================================================
// BUTTON LABELS
// ============================================================================
export const BUTTON_LABELS = Object.freeze({
  // Generic Actions
  SAVE: "Save",
  CANCEL: "Cancel",
  DELETE: "Delete",
  EDIT: "Edit",
  CREATE: "Create",
  UPDATE: "Update",
  SUBMIT: "Submit",
  CONFIRM: "Confirm",
  RETRY: "Retry",
  REFRESH: "Refresh",
  // Navigation
  BACK_TO_DASHBOARD: "Back to Dashboard",
  BACK_TO_DASHBOARD_ARIA: "Back to dashboard",
  CLOSE_MODAL_ARIA: "Close modal",
  PREVIOUS: "Previous",
  NEXT: "Next",
  // User Management
  ADD_USER: "Add User",
  CREATE_USER: "Create User",
  SAVE_CHANGES: "Save Changes",
  // Profile
  UPDATE_PROFILE: "Update Profile",
  CHANGE_PASSWORD: "Change Password",
  // Posts
  NEW_POST: "New Post",
  SAVE_DRAFT: "Save Draft",
  SAVE_POST: "Save Post",
  ADD: "Add",
  EXPORT_MDX: "Export MDX",
  PUBLISH_TO_MEDIUM: "Publish to Medium",
  PUBLISH_TO_DEVTO: "Publish to DEV.to",
  PUBLISH_TO_WORDPRESS: "Publish to WordPress",
  PUBLISH_TO_LINKEDIN: "Publish to LinkedIn",
  PUBLISH_TO_ALL: "Publish to All",
  REMOVE_FROM_MEDIUM: "Remove from Medium",
  REMOVE_FROM_DEVTO: "Remove from DEV.to",
  REMOVE_FROM_WORDPRESS: "Remove from WordPress",
  CONNECT_LINKEDIN: "Connect with LinkedIn",
  DISCONNECT_LINKEDIN: "Disconnect LinkedIn",
  CONNECTING_LINKEDIN: "Connecting…",
  // Settings
  SAVE_CREDENTIALS: "Save Credentials",
  DISCONNECT_PLATFORM: "Disconnect",
  CLEAR_FIELDS_TO_DISCONNECT: "Clear all fields and save to disconnect",
  CONNECT_PLATFORM_TO_PUBLISH: "Connect a platform in Settings to publish",
  LINKEDIN_CONNECT_HINT: "Connect LinkedIn in Settings to publish this summary",
  LINKEDIN_SUMMARY_REQUIRED_PUBLISH: "Generate a LinkedIn summary before publishing",
  // Auth
  SIGN_IN: "Sign In",
  SIGN_UP: "Sign Up",
  SIGN_OUT: "Sign Out",
  CREATE_ACCOUNT: "Create Account",
  CREATE_ACCOUNT_BUTTON: "Create Account",
  // Dashboard
  CREATE_FIRST_POST: "Create Your First Post",
  CLEAR_FILTER: "Clear filter",
  SHOW_PREVIEW: "Show Preview",
  HIDE_PREVIEW: "Hide Preview",
} as const);

// ============================================================================
// PAGE TITLES
// ============================================================================
export const PAGE_TITLES = Object.freeze({
  DASHBOARD: "Dashboard",
  DASHBOARD_TITLE: "Dashboard",
  USER_MANAGEMENT: "User Management",
  USER_MANAGEMENT_TITLE: "User Management",
  USERS: "Users",
  PROFILE_SETTINGS: "Profile Settings",
  PROFILE_SETTINGS_TITLE: "Profile Settings",
  SETTINGS: "Settings",
  SETTINGS_TITLE: "Settings",
  EDIT_POST: "Edit Post",
  NEW_POST: "New Post",
  SIGN_IN: "Sign In",
  SIGN_UP: "Sign Up",
  CREATE_ACCOUNT: "Create your account",
  WELCOME_BACK: "Welcome back",
} as const);

// ============================================================================
// PAGE DESCRIPTIONS
// ============================================================================
export const PAGE_DESCRIPTIONS = Object.freeze({
  DASHBOARD: "Manage your blog posts and publishing status",
  DASHBOARD_DESCRIPTION: "Manage your blog posts and publishing status",
  USER_MANAGEMENT: "Manage users and their permissions",
  USER_MANAGEMENT_DESCRIPTION: "Manage users and their permissions",
  PROFILE_SETTINGS: "Manage your account information and security settings",
  PROFILE_SETTINGS_DESCRIPTION: "Manage your account information and security settings",
  SETTINGS: "Configure your API credentials and platform settings",
  UPDATE_POST: "Update your blog post",
  CREATE_POST: "Create a new blog post",
  EDITOR_SUBTITLE: "Write and preview your blog post in Markdown.",
  SIGN_IN: "Sign in to your account to continue",
  SIGN_IN_DESCRIPTION: "Sign in to your account to continue",
  SIGN_IN_FORM: "Enter your credentials to access your account",
  SIGN_IN_DESCRIPTION_2: "Enter your credentials to access your account",
  SETTINGS_DESCRIPTION: "Configure your API credentials and platform settings",
  JOIN_SYNCAPP: "Join SyncApp to start publishing your blog posts",
  FILL_DETAILS: "Fill in your details to create an account",
} as const);

// ============================================================================
// MODAL TITLES & DESCRIPTIONS
// ============================================================================
export const MODAL_TITLES = Object.freeze({
  ADD_NEW_USER: "Add New User",
  EDIT_USER: "Edit User",
  DELETE_USER: "Delete User",
  DELETE_POST: "Delete Post",
  CONFIRM_ACTION: "Confirm Action",
} as const);

export const MODAL_DESCRIPTIONS = Object.freeze({
  CREATE_NEW_USER_ACCOUNT: "Create a new user account",
  EDITING_USER: (name: string) => `Editing: ${name}`,
} as const);

// ============================================================================
// INFO MESSAGES - Informational text, help text, descriptions
// ============================================================================
export const INFO_MESSAGES = Object.freeze({
  // Generic
  PLEASE_WAIT: "Please wait...",
  LOADING: "Loading...",
  // Loading States
  LOADING_USERS: "Loading users...",
  LOADING_POSTS: "Loading posts...",
  CREATING: "Creating...",
  PROCESSING: "Processing...",
  SAVING: "Saving...",
  UPDATING: "Updating...",
  PUBLISHING: "Publishing...",
  PUBLISHING_TO_PLATFORM: (platform: string) => `Publishing to ${platform}…`,
  PUBLISHING_TO_ALL: "Publishing to all connected platforms…",
  SIGNING_IN: "Signing in...",
  CREATING_ACCOUNT: "Creating account...",
  CHANGING_PASSWORD: "Changing Password...",
  UPLOADING_IMAGE: "Uploading image...",
  UPLOADING_DROPPED_IMAGE: "Uploading dropped image...",
  // Dashboard
  TOTAL_POSTS: "Total Posts",
  PUBLISHED: "Published",
  DRAFTS: "Drafts",
  SCHEDULED: "Scheduled",
  SCHEDULE_MISSED: "Scheduled publish missed — will retry at next daily run",
  PLATFORMS: "Platforms",
  ALL_POSTS: "All Posts",
  NO_POSTS_YET: "No posts yet. Create your first post to get started!",
  SHOWING_POSTS: (count: number) => `Showing ${count} post${count === 1 ? "" : "s"}`,
  NO_POSTS_TITLE: "No posts yet",
  NO_POSTS_DESCRIPTION: "Start writing your first blog post to get published on Medium and DEV.to",
  // User Management
  ALL_USERS: "All Users",
  NO_USERS_FOUND: "No users found",
  NO_USERS_FOUND_DESCRIPTION: "Try adjusting your search or filter criteria",
  SHOWING_USERS: (showing: number, total: number) => `Showing ${showing} of ${total} user${total === 1 ? "" : "s"}`,
  PAGE_OF: (page: number, pages: number) => `Page ${page} of ${pages}`,
  // Profile
  PROFILE_INFORMATION: "Profile Information",
  PROFILE_INFORMATION_DESC: "Update your personal information and profile details",
  CHANGE_PASSWORD_DESC: "Update your password to keep your account secure",
  CHANGE_PASSWORD_DESCRIPTION: "Update your password to keep your account secure",
  PROFILE_INFORMATION_DESCRIPTION: "Update your personal information and profile details",
  ACCOUNT_INFORMATION: "Account Information",
  ACCOUNT_INFORMATION_DESC: "Your account details and statistics",
  // Settings
  MEDIUM_INTEGRATION: "Medium Integration",
  MEDIUM_INTEGRATION_DESC: "Connect your Medium account to publish posts directly",
  DEVTO_INTEGRATION: "DEV.to Integration",
  DEVTO_INTEGRATION_DESC: "Connect your DEV.to account to publish posts directly",
  WORDPRESS_INTEGRATION: "WordPress Integration",
  WORDPRESS_INTEGRATION_DESC: "Connect your WordPress site to publish posts directly",
  LINKEDIN_INTEGRATION: "LinkedIn Integration",
  LINKEDIN_INTEGRATION_DESC: "Connect LinkedIn with OAuth to publish the short summary (not the full article)",
  LINKEDIN_HOW_TO_CONNECT: "Before Connect — LinkedIn app + browser checklist:",
  LINKEDIN_OAUTH_STEP_1: "Auth tab: add the exact Redirect URI below (and keep Update saved)",
  LINKEDIN_OAUTH_STEP_2: "Products: enable Sign In with LinkedIn (OpenID) AND Share on LinkedIn",
  LINKEDIN_OAUTH_STEP_3:
    "Use Incognito / disable ad blockers — LinkedIn OAuth breaks when trackers are blocked (ERR_BLOCKED_BY_CLIENT)",
  LINKEDIN_REDIRECT_URI_LABEL: "Redirect URI SyncApp sends (must match LinkedIn Auth tab)",
  LINKEDIN_COPY_REDIRECT_URI: "Copy redirect URI",
  LINKEDIN_REDIRECT_COPIED: "Redirect URI copied",
  LINKEDIN_OAUTH_BROWSER_HINT:
    "If you see LinkedIn “Bummer, something went wrong”, retry in a private window with extensions off.",
  LINKEDIN_CONNECTED_SUCCESS: "LinkedIn connected successfully",
  LINKEDIN_CONNECT_FAILED: "Failed to start LinkedIn connection",
  LINKEDIN_OAUTH_NOT_CONFIGURED: "LinkedIn OAuth is not configured on the server",
  LINKEDIN_TOKEN_EXPIRED_HINT:
    "LinkedIn session expired (or was never refreshable). Connect again to resume publishing.",
  PLATFORM_STATUS: "Platform Status",
  PLATFORM_STATUS_DESC: "Current status of your connected platforms",
  HELP_SUPPORT: "Help & Support",
  HELP_SUPPORT_DESC: "Resources to help you get started",
  SAVED: "Saved!",
  TOKEN_ENCRYPTED: "This token will be encrypted and stored securely",
  BOTH_REQUIRED_DEVTO: "Both username and API key are required for DEV.to integration",
  WORDPRESS_URL_INFO: "Your WordPress site URL (e.g., https://yoursite.com)",
  WORDPRESS_API_KEY_INFO: "Your WordPress username:password or application password",
  BOTH_REQUIRED_WORDPRESS: "Both site URL and API key are required for WordPress integration",
  // Error boundary
  SOMETHING_WENT_WRONG: "Something went wrong",
  UNEXPECTED_ERROR_TRY_AGAIN: "An unexpected error occurred. Please try again.",
  GO_TO_DASHBOARD: "Go to Dashboard",
  // Layout / Nav
  TOGGLE_THEME: (mode: string) => `Switch to ${mode} mode`,
  TOGGLE_THEME_ARIA: "Toggle theme",
  USER_MENU_ARIA: "User menu",
  OPEN_MOBILE_MENU_ARIA: "Open mobile menu",
  PROFILE_SETTINGS_LINK: "Profile Settings",
  // Toast titles (unpublish, errors)
  UNPUBLISHED: "Unpublished",
  ERROR_TITLE: "Error",
  // Filters
  FILTER_ALL: "All",
  CLEAR_ALL_FILTERS: "Clear all filters",
  // Post list
  TAGS_MORE: (n: number) => `+${n} more`,
  // SEO
  SEO_SCORE_ARIA: (score: number, maxScore: number, summary?: string) =>
    `SEO score: ${score} out of ${maxScore}. ${summary || ""}`,
  // Profile default avatar
  DEFAULT_AVATAR_LETTER: "U",
  // Editor
  RICH_TEXT_EDITOR: "Rich text editor",
  POST_METADATA: "Post Metadata",
  ACTION_BUTTONS: "Action Buttons",
  PREVIEW: "Preview",
  UNTITLED_POST: "Untitled Post",
  NO_CONTENT_YET: "*No content yet...*",
  TITLE_SLUG_INFO: "Enter the post title here, it will create a slug for the post",
  CONTENT_MARKDOWN_HINT:
    "Supports GitHub Flavored Markdown: **bold**, *italic*, [links](url), images, code blocks, etc.",
  TAGS_HELP: "DEV.to allows 4 tags — use 2 high-reach (webdev, programming) + 2 stack-specific",
  TAGS_LIMIT_REACHED: "DEV.to allows a maximum of 4 tags",
  META_DESCRIPTION_LABEL: "Meta Description",
  META_DESCRIPTION_PLACEHOLDER: "Snippet-ready summary for Google (120-150 chars)",
  // AI Assistant
  AI_ASSISTANT_HINT: "Concise SEO-optimized draft — stops when the problem is solved",
  // PostCard/PostRow
  PUBLISHED_ON: "Published On:",
  CREATED: "Created:",
  UPDATED: "Updated:",
  PUBLISHED_DATE: "Published:",
  HAS_COVER_IMAGE: "📷 Has cover image",
  POST_COVER_ALT: (title: string) => `Featured image for ${title}`,
  NO_TAGS: "No tags",
  // Settings Help
  GO_TO: "Go to",
  HOW_TO_GET_MEDIUM_KEY: "How to get your Medium API key:",
  HOW_TO_GET_DEVTO_KEY: "How to get your DEV.to API key:",
  HOW_TO_GET_WORDPRESS_KEY: "How to get your WordPress API key:",
  MEDIUM_SETTINGS: "Medium Settings",
  INTEGRATION_TOKENS: "Integration tokens",
  GET_INTEGRATION_TOKEN: "Get integration token",
  COPY_TOKEN: "Copy the generated token",
  DEVTO_SETTINGS: "DEV.to Settings",
  API_KEYS_SECTION: "API Keys section",
  GENERATE_API_KEY: "Generate API Key",
  COPY_KEY: "Copy the generated key",
  INSTALL_JWT_PLUGIN: "Install and activate the JWT Authentication plugin",
  WORDPRESS_ADMIN: "Go to WordPress Admin → Users → Your Profile",
  GENERATE_APP_PASSWORD: "Generate a new application password",
  USE_USERNAME_PASSWORD: "Use your username and the generated password as the API key",
  MEDIUM_INTEGRATION_GUIDE: "Medium Integration Token Guide",
  DEVTO_API_KEY_GUIDE: "DEV.to API Key Guide",
  WORDPRESS_JWT_PLUGIN: "WordPress JWT Authentication Plugin",
  GITHUB_REPOSITORY: "GitHub Repository",
  // Error Messages - Settings
  FAILED_TO_LOAD_CREDENTIALS: "Failed to load credentials",
  CREDENTIAL_DECRYPT_FAILED_BANNER:
    "Saved API key cannot be decrypted (ENCRYPTION_KEY changed or key is outdated). Re-enter your API key below and save.",
  CREDENTIAL_REENTER_REQUIRED: "Re-enter API key to reconnect",
  // Auth
  DONT_HAVE_ACCOUNT: "Don't have an account?",
  SIGN_UP_HERE: "Sign up here",
  ALREADY_HAVE_ACCOUNT: "Already have an account?",
  SIGN_IN_HERE: "Sign in here",
  COPYRIGHT: "© 2025 SyncApp. All rights reserved.",
  // Form Helpers
  PASSWORD_OPTIONAL: "(optional - default will be generated)",
  REQUIRED_FIELD: "*",
  // i18n
  CHARACTERS: "Characters: ",
  AIM_SEO: "Aim: 120-160",
  PREVIEW_UNAVAILABLE: "Preview Unavailable (Private Bucket)",
  STORAGE_VIEWER_ROLE_HINT: 'Make sure "allUsers" has "Storage Object Viewer" role on your bucket.',
} as const);

// ============================================================================
// SERVER-SIDE ERROR MESSAGES (for API responses)
// ============================================================================
export const SERVER_ERROR_MESSAGES = Object.freeze({
  // Auth
  ACCESS_TOKEN_REQUIRED: "Access token required",
  INVALID_OR_EXPIRED_TOKEN: "Invalid or expired token",
  ACCESS_DENIED: "Access denied",
  ADMIN_ACCESS_REQUIRED: "Access denied. Admin privileges required.",
  USER_NOT_FOUND: "User not found",
  INVALID_EMAIL_OR_PASSWORD: "Invalid email or password",
  // User Management
  FAILED_TO_VERIFY_ADMIN: "Failed to verify admin access",
  INVALID_ROLE: "Invalid role. Must be 'user' or 'admin'",
  // Posts
  ACCESS_DENIED_POST: "Access denied",
  // General
  REQUEST_FAILED: "Request failed",
  // MDX
  FAILED_TO_DOWNLOAD_MDX: "Failed to download MDX",
  FAILED_TO_GENERATE_MDX: "Failed to generate MDX",
  COULD_NOT_EXPORT_MDX: "Could not export MDX",
  EXPORT_FORMAT_MDX: "MDX",
  // Publishing
  INVALID_MEDIUM_API_KEY: "Invalid Medium API key",
  INVALID_DEVTO_API_KEY: "Invalid DEV.to API key",
  INVALID_WORDPRESS_API_KEY: "Invalid WordPress API key",
  FAILED_TO_PUBLISH_ANY_PLATFORM: "Failed to publish to any platform",
  // Encryption
  FAILED_TO_ENCRYPT: "Failed to encrypt data",
  FAILED_TO_DECRYPT: "Failed to decrypt data",
} as const);

// ============================================================================
// SERVER-SIDE SUCCESS MESSAGES (for API responses)
// ============================================================================
export const SERVER_SUCCESS_MESSAGES = Object.freeze({
  // Auth
  LOGIN_SUCCESS: "Login successful",
  REGISTRATION_SUCCESS: "User registered successfully",
  PROFILE_UPDATED: "Profile updated successfully",
  PASSWORD_CHANGED: "Password changed successfully",
  // User Management
  USER_UPDATED: "User updated successfully",
  USER_DELETED: "User deleted successfully",
  // Posts
  POST_CREATED: "Post created successfully",
  POST_UPDATED: "Post updated successfully",
  POST_DELETED: "Post deleted successfully",
} as const);

// ============================================================================
// GROUPED UI EXPORTS - For easier imports and better organization
// ============================================================================

/**
 * All UI Labels - Form labels, table headers, status labels
 * Usage: import { UI_LABELS } from '@constants';
 */
export const UI_LABELS = Object.freeze({
  ...LABELS,
});

/**
 * All UI Placeholders - Input placeholders
 * Usage: import { UI_PLACEHOLDERS } from '@constants';
 */
export const UI_PLACEHOLDERS = Object.freeze({
  ...PLACEHOLDERS,
});

/**
 * All Button Labels - Button text
 * Usage: import { UI_BUTTONS } from '@constants';
 */
export const UI_BUTTONS = Object.freeze({
  ...BUTTON_LABELS,
});

/**
 * All UI Titles - Page titles, modal titles, toast titles
 * Usage: import { UI_TITLES } from '@constants';
 */
export const UI_TITLES = Object.freeze({
  ...PAGE_TITLES,
  ...MODAL_TITLES,
  ...TOAST_TITLES,
});

/**
 * All UI Descriptions - Page descriptions, modal descriptions
 * Usage: import { UI_DESCRIPTIONS } from '@constants';
 */
export const UI_DESCRIPTIONS = Object.freeze({
  ...PAGE_DESCRIPTIONS,
  ...MODAL_DESCRIPTIONS,
});

/**
 * All User Messages - Success, error, warning, validation, info messages
 * Usage: import { UI_MESSAGES } from '@constants';
 */
export const UI_MESSAGES = Object.freeze({
  ...SUCCESS_MESSAGES,
  ...ERROR_MESSAGES,
  ...WARNING_MESSAGES,
  ...VALIDATION_MESSAGES,
  ...INFO_MESSAGES,
});

/**
 * All Server Messages - Server-side error and success messages
 * Usage: import { SERVER_MESSAGES } from '@constants';
 */
export const SERVER_MESSAGES = Object.freeze({
  ...SERVER_ERROR_MESSAGES,
  ...SERVER_SUCCESS_MESSAGES,
});

// ============================================================================
// EDITOR UI STRINGS - Sidebar labels, status, schedule copy
// ============================================================================
export const EDITOR_UI = Object.freeze({
  // Publish sidebar
  STATUS_LABEL: "Status",
  SCHEDULE_PUBLICATION_LABEL: "Schedule Publication",
  SCHEDULE_AUTO_PUBLISH: (formattedDate: string, platformsLabel?: string) =>
    platformsLabel
      ? `Will publish to ${platformsLabel} after ${formattedDate} (daily run at midnight)`
      : `Will publish after ${formattedDate} (daily run at midnight)`,
  SCHEDULE_MODAL_TITLE: "Schedule publication",
  SCHEDULE_MODAL_DESC:
    "Pick when to publish and which connected platforms should receive the post on the next daily midnight run.",
  SCHEDULE_MODAL_DATETIME_LABEL: "Publish date & time",
  SCHEDULE_MODAL_PLATFORMS_LABEL: "Publish to",
  SCHEDULE_MODAL_PLATFORMS_HINT: "Only platforms with saved credentials are listed.",
  SCHEDULE_MODAL_NO_CONNECTED:
    "Connect at least one platform in Settings before scheduling a publication.",
  SCHEDULE_MODAL_NO_PLATFORMS: "Select at least one platform to schedule for.",
  SCHEDULE_MODAL_BUTTON: "Schedule publication",
  SCHEDULE_MODAL_EDIT: "Edit schedule",
  SCHEDULE_MODAL_CONFIRM: "Set schedule",
  SCHEDULE_MODAL_SAVING: "Saving...",
  SCHEDULE_MODAL_CANCEL: "Cancel",
  SCHEDULE_MODAL_CLEAR: "Clear schedule",
  SCHEDULE_MODAL_PAST_DATE: "Choose a date and time in the future.",
  SCHEDULE_MODAL_NO_DATE: "Select a date and time to continue.",
  SCHEDULE_MODAL_PUBLISHED_DISABLED: "Published posts cannot be rescheduled.",
  SCHEDULE_SET_SUCCESS: "Publication schedule saved.",
  SCHEDULE_CLEARED_SUCCESS: "Publication schedule cleared.",
  SCHEDULE_SAVE_FAILED: "Failed to save publication schedule.",

  // AI section (sidebar)
  GENERATE_AI_COVER_IMAGE: "Generate AI Cover Image",
  GENERATING_POST: "Generating Post...",
  GENERATE_FULL_POST: "Generate Post",
  CREATING_MASTERPIECE: "Creating Masterpiece...",
  GENERATE_AI_IMAGE: "Generate AI Image",

  /** Featured / cover image (left sidebar + mobile drawer) */
  COVER_UPLOAD_DROPZONE_TITLE: "Upload featured image",
  COVER_UPLOAD_DROPZONE_HINT: "Click or drop an image here (JPEG, PNG, WebP, GIF).",
  COVER_UPLOAD_BROWSE: "Choose image",
  COVER_UPLOAD_CHANGE: "Replace image",
  COVER_UPLOAD_REMOVE: "Remove",
  COVER_UPLOAD_OR_URL: "Or paste an image URL",
  COVER_UPLOAD_INVALID_TYPE: "Please choose an image file.",
  COVER_UPLOAD_TOO_LARGE: "Image must be 50MB or smaller.",
  COVER_UPLOADING: "Uploading cover\u2026",
  COVER_UPLOAD_SUCCESS: "Featured image uploaded",
  COVER_PREVIEW_ALT: "Featured image preview",
  COVER_PREVIEW_CACHED_ALT: "Featured image preview (cached)",
  COVER_REMOVE_ARIA: "Remove featured image",

  /** Mobile temporary drawer for Post Settings (left panel) */
  POST_SETTINGS_DRAWER_TITLE: "Post Settings",
  CLOSE_POST_SETTINGS_DRAWER: "Close post settings panel",
  TOGGLE_POST_SETTINGS: "Toggle post settings",

  /** Mobile temporary drawer for Publish + AI (right panel) */
  PUBLISH_AI_DRAWER_TITLE: "Publish & AI",
  CLOSE_PUBLISH_AI_DRAWER: "Close publish and AI panel",
  TOGGLE_PUBLISH_AI: "Toggle publish panel",

  // AI Image modal header
  AI_IMAGE_MODAL_TITLE: "AI Cover Image Generator",
  AI_IMAGE_MODAL_DESC: "Create stunning, high-resolution featured cover images for your blog posts using Gemini AI.",

  // Modal – settings pane labels
  AI_IMAGE_TOPIC_LABEL: "Topic or Keyword",
  AI_IMAGE_TOPIC_PLACEHOLDER: "e.g. Next.js performance tips",
  AI_IMAGE_TOPIC_HINT: "AI will use this to analyze context and construct the primary subject.",
  AI_IMAGE_STYLE_LABEL: "Style / Theme Instructions",
  AI_IMAGE_STYLE_PLACEHOLDER:
    "e.g. minimalist illustration, modern flat design, tech blueprint vibes, deep indigo and violet colors...",
  AI_IMAGE_STYLE_HINT: "Specify artistic style, color palettes, background theme, or mood.",

  // Modal – loading state
  GENERATING_IMAGE: "Generating Image...",
  GENERATING_IMAGE_HINT: "Gemini is handcrafting your high-res blog cover. Please wait.",

  // Modal – image overlay badges
  AI_MASTERPIECE_BADGE: "AI Masterpiece",
  ACTIVE_COVER_BADGE: "Active Cover",

  // Modal – image captions
  IMAGE_GENERATED_CAPTION: "Successfully generated. Select an action below to attach it to your post.",
  IMAGE_SVG_FALLBACK_CAPTION:
    "Gemini image quota is unavailable right now — using a branded SVG cover. Retry later or enable billing in Google AI Studio.",
  IMAGE_CURRENT_CAPTION: "Currently active post cover image.",
  AI_COVER_IMAGE_ALT: "Cover masterpiece",

  // Modal – empty state
  NO_IMAGE_TITLE: "No image generated yet",
  NO_IMAGE_HINT: "Fill in the instructions on the left and click Generate to see the magic.",

  // Modal – action buttons
  APPLY_LOCALLY: "Apply Locally",
  USE_AS_COVER: "Use as Cover",
  COPY_IMAGE_LINK: "Copy Link",
  DOWNLOAD_IMAGE: "Download",
  COPY_IMAGE_URL_TITLE: "Copy public cloud URL",
  COPY_IMAGE_DATA_TITLE: "Copy image data",
  AI_IMAGE_SOURCE_BADGE: (source: string) => `AI · ${source}`,
  UPLOADING: "Uploading\u2026",
  UPLOAD_AND_SAVE: "Upload & Save",

  // Modal – no post-id warning
  SAVE_DRAFT_FIRST_HINT: "Save this post as a draft first to enable permanent cloud attachment.",

  // Trending topics (AI assistant)
  TRENDING_TOPICS_TITLE: "Trending topics for better reach",
  TRENDING_TOPICS_HINT: "Click a topic to use it, or type your own.",
  TRENDING_TOPICS_LIVE_HINT: "Real-time topics via Google Search grounding (AI Studio).",
  TRENDING_TOPICS_ERROR: "Could not load live Google topics and keywords. Check the AI key/quota, then try Refresh.",
  TRENDING_TOPICS_UNAVAILABLE: "Live Google topics unavailable",
  TRENDING_TOPICS_EMPTY: "No live topics loaded yet. Click Refresh to try again.",
  TRENDING_TOPICS_LOADING: "Fetching real-time topics\u2026",
  TRENDING_TOPICS_REFRESH: "Refresh",
  TRENDING_TOPICS_SOURCE_LIVE: "Live · Google Search",
  TRENDING_TOPICS_SOURCE_CACHED: "Cached · Google Search",
  TRENDING_TOPICS_UPDATED_PREFIX: "Updated",
  TRENDING_TOPICS_PENDING: "Waiting for Google Search",
  GOOGLE_KEYWORDS_TITLE: "Google SEO keywords",
  GOOGLE_KEYWORDS_HINT: "Click a keyword to use it as your primary search term for the draft.",
  GOOGLE_KEYWORDS_LIVE_HINT: "Search-intent keywords from the same Google Search grounding pass.",
  GOOGLE_KEYWORDS_EMPTY: "No live Google keywords loaded yet.",

  // Generate post modal
  GENERATE_POST_MODAL_TITLE: "Generate SEO post",
  GENERATE_POST_MODAL_DESC:
    "Research high-intent keywords from a seed topic, pick a winner, then generate an SEO draft optimized for your platforms.",
  GENERATE_POST_MODEL_LABEL: "AI model",
  GENERATE_POST_TARGETS_LABEL: "Optimize for",
  GENERATE_POST_TARGETS_HINT:
    "Select at least one. Google optimizes for Search SEO; LinkedIn adds a short summary + Read more; the full article stays in the editor.",
  GENERATE_POST_TARGET_DEVTO: "DEV.to",
  GENERATE_POST_TARGET_LINKEDIN: "LinkedIn",
  GENERATE_POST_TARGET_GOOGLE: "Google",
  GENERATE_POST_TARGETS_REQUIRED: "Select at least one platform",
  GENERATE_POST_KEYWORD_LABEL: "Topic or keyword",
  GENERATE_POST_KEYWORD_PLACEHOLDER: "e.g. Building a Next.js app with MongoDB",
  KEYWORD_RESEARCH_TITLE: "Keyword research",
  KEYWORD_RESEARCH_HINT:
    "Enter a broad seed topic. AI uses Google Search grounding to find long-tail keywords with high commercial intent and lower competition.",
  KEYWORD_RESEARCH_SEED_LABEL: "Seed topic",
  KEYWORD_RESEARCH_SEED_PLACEHOLDER: "e.g. serverless billing",
  KEYWORD_RESEARCH_BUTTON: "Research keywords",
  KEYWORD_RESEARCH_LOADING: "Researching keywords\u2026",
  KEYWORD_RESEARCH_ERROR: "Keyword research failed. Check AI configuration and try again.",
  KEYWORD_RESEARCH_EMPTY: "No opportunities yet. Enter a seed and click Research keywords.",
  KEYWORD_RESEARCH_SCORES_NOTE:
    "Scores are AI estimates from Search grounding — not measured volume or keyword difficulty.",
  KEYWORD_RESEARCH_OPPORTUNITY: "Opportunity",
  KEYWORD_RESEARCH_INTENT: "Intent",
  KEYWORD_RESEARCH_COMPETITION: "Competition",
  KEYWORD_RESEARCH_ANGLE: "Monetization",
  KEYWORD_RESEARCH_SELECTED: "Selected for draft",
  KEYWORD_RESEARCH_CACHED: "Cached results",
  KEYWORD_RESEARCH_LIVE: "Live · Google Search",
  REACH_TAGS_TITLE: "High-reach DEV.to tags",
  REACH_TAGS_HINT:
    "Live popular tags from DEV.to. AI picks 2 reach tags from this list + 2 stack-specific tags (4 total).",
  REACH_TAGS_LIVE_HINT: "Fetched from DEV.to /api/tags (ordered by popularity).",
  REACH_TAGS_LOADING: "Fetching DEV.to tags\u2026",
  REACH_TAGS_EMPTY: "No DEV.to tags loaded yet. Click Refresh to try again.",
  REACH_TAGS_ERROR: "Could not load high-reach tags from DEV.to. Try Refresh.",
  REACH_TAGS_UNAVAILABLE: "Live DEV.to tags unavailable",
  REACH_TAGS_SOURCE_LIVE: "Live · DEV.to",
  REACH_TAGS_PENDING: "Waiting for DEV.to",
  GENERATE_POST_CANCEL: "Cancel",
  GENERATE_POST_CONFIRM: "Generate draft",
  GENERATE_POST_KEYWORD_REQUIRED: "Enter a topic or pick one below",
  SELECT_AI_MODEL_ARIA: "Select AI Model",
  REMOVE_TAG_ARIA: (tag: string) => `Remove ${tag}`,
  WORD_COUNT_LABEL: (count: string) => `${count} words`,
  UNSAVED_CHANGES_TITLE: "Unsaved changes",
  UNSAVED_LEAVE_TITLE: "Leave without saving?",
  UNSAVED_LEAVE_MESSAGE: "Going back will discard the post details you entered. This cannot be undone.",
  UNSAVED_LEAVE_CONFIRM: "OK",
  UNSAVED_LEAVE_CANCEL: "Cancel",

  // TipTap editor — toolbar, prompts, status bar, skeletons
  TIPTAP_PLACEHOLDER: "Start writing your post…",
  TITLE_INPUT_PLACEHOLDER: "Add title",
  POST_TITLE_ARIA: "Post title",
  PROMPT_IMAGE_URL: "Image URL:",
  PROMPT_LINK_URL: "Link URL:",
  TOOLBAR_HEADING_1: "Heading 1",
  TOOLBAR_HEADING_2: "Heading 2",
  TOOLBAR_HEADING_3: "Heading 3",
  TOOLBAR_NORMAL_TEXT: "Normal text",
  TOOLBAR_BOLD: "Bold (Ctrl+B)",
  TOOLBAR_ITALIC: "Italic (Ctrl+I)",
  TOOLBAR_UNDERLINE: "Underline (Ctrl+U)",
  TOOLBAR_STRIKETHROUGH: "Strikethrough",
  TOOLBAR_INLINE_CODE: "Inline code",
  TOOLBAR_BULLET_LIST: "Bullet list",
  TOOLBAR_ORDERED_LIST: "Ordered list",
  TOOLBAR_BLOCKQUOTE: "Blockquote",
  TOOLBAR_CODE_BLOCK: "Code block",
  TOOLBAR_ALIGN_LEFT: "Align left",
  TOOLBAR_ALIGN_CENTER: "Align center",
  TOOLBAR_ALIGN_RIGHT: "Align right",
  TOOLBAR_LINK: "Link",
  TOOLBAR_IMAGE: "Image",
  TOOLBAR_HORIZONTAL_RULE: "Horizontal rule",
  TOOLBAR_UNDO: "Undo (Ctrl+Z)",
  TOOLBAR_REDO: "Redo (Ctrl+Y)",
  STATUS_UNSAVED_CHANGES: "Unsaved changes",
  STATUS_SAVED_AT: (time: string) => `Saved at ${time}`,
  STATUS_NOT_SAVED_YET: "Not saved yet",
  STATUS_NEW_POST: "New post",
  CHAR_COUNT_LABEL: (count: string) => `${count} chars`,
  READ_TIME_LABEL: (minutes: number) => `${minutes} min read`,
  AI_TOOLKIT_TRIGGER: "AI Toolkit examples",
  AI_TOOLKIT_ADD_COMMENT: "Add AI comment",
  AI_TOOLKIT_ADD_PARAGRAPH: "Add new paragraph",
  AI_TOOLKIT_PROOFREAD: "Proofread",
  AI_TOOLKIT_ADJUST_SELECTION: "Adjust text selection",
  AI_TOOLKIT_ADD_COMPONENT: "Add custom component",
  AI_TOOLKIT_JUSTIFY_EDIT: "Justify edit",
  LOADING_EDITOR_ARIA: "Loading editor",
  LOADING_PREVIEW_ARIA: "Loading preview",

  // LinkedIn teaser panel
  LINKEDIN_POST_TITLE: "LinkedIn summary",
  LINKEDIN_POST_HINT:
    "Short interactive LinkedIn post (with emojis). Full article stays in the editor — link readers to your site.",
  LINKEDIN_POST_COPY: "Copy for LinkedIn",
  LINKEDIN_POST_PUBLISH: "Publish to LinkedIn",
  LINKEDIN_POST_GENERATE: "Generate LinkedIn summary",
  LINKEDIN_POST_REGENERATE: "Regenerate summary",
  LINKEDIN_POST_GENERATING: "Generating summary…",
  LINKEDIN_POST_READ_MORE_LABEL: "Read more URL",
  LINKEDIN_POST_MISSING_CANONICAL:
    "Set NEXT_PUBLIC_CANONICAL_BASE_URL (and server CANONICAL_BASE_URL) to your live blog so Read more can link to the full article.",
  LINKEDIN_POST_EMPTY:
    "No LinkedIn summary yet. Generate one from your article title and content, or include LinkedIn when generating a full draft.",
} as const);

// ============================================================================
// LEGACY SYNC_LABEL - Backward compatibility
// Combines all message types for easy access (deprecated - use specific exports above)
// ============================================================================
export const SYNC_LABEL = Object.freeze({
  // Success Messages
  ...SUCCESS_MESSAGES,
  // Error Messages
  ...ERROR_MESSAGES,
  // Warning Messages
  ...WARNING_MESSAGES,
  // Validation Messages
  ...VALIDATION_MESSAGES,
  // Labels
  ...LABELS,
  // Placeholders
  ...PLACEHOLDERS,
  // Button Labels
  ...BUTTON_LABELS,
  // Page Titles
  ...PAGE_TITLES,
  // Page Descriptions
  ...PAGE_DESCRIPTIONS,
  // Modal Titles
  ...MODAL_TITLES,
  // Modal Descriptions
  ...MODAL_DESCRIPTIONS,
  // Info Messages
  ...INFO_MESSAGES,
});
