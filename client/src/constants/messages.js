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
  // Validation
  VALIDATION_ERROR: "Validation Error",
  // Network
  NETWORK_ERROR: "Network Error",
});

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
    WELCOME_MESSAGE: (name) => `Hello ${name}!`,
    ACCOUNT_CREATED: (name) => `Account created successfully for ${name}!`,
    // User Management
    USER_CREATED: (username) => `User "${username}" has been created successfully`,
    USER_DELETED: (username) => `User "${username}" has been deleted successfully`,
    USER_UPDATED: "User has been updated successfully",
    // Profile
    PROFILE_UPDATED: "Your profile has been updated successfully",
    PASSWORD_CHANGED: "Your password has been updated successfully",
    // Posts
    POST_CREATED: "Post created successfully",
    POST_UPDATED: "Post updated successfully",
    POST_DELETED: "Post deleted successfully",
    // Publishing
    PUBLISHED_TO_PLATFORM: (platform) => `Post successfully published to ${platform}`,
    PUBLISHED_ALL: "Post published to all platforms successfully!",
    // Credentials
    CREDENTIALS_SAVED: (platform) => `${platform} API credentials saved successfully`,
    // Export
    EXPORT_SUCCESS: (format) => `Post exported as ${format} successfully`,
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
  FAILED_TO_LOAD_POSTS: (error) => `Failed to load posts: ${error}`,
  FAILED_TO_LOAD_POSTS_TITLE: "Failed to load posts",
  // Publishing
  FAILED_TO_PUBLISH_PLATFORM: (platform, error) => `Failed to publish to ${platform}: ${error}`,
  FAILED_TO_PUBLISH_ALL: "Failed to publish to all platforms",
  FAILED_TO_UNPUBLISH: (platform, error) => `Failed to unpublish from ${platform}: ${error}`,
  // Credentials
  CREDENTIALS_SAVE_FAILED: (platform, error) => `Failed to save ${platform} credentials: ${error}`,
  // Export
  EXPORT_FAILED: (format, error) => `Failed to export as ${format}: ${error}`,
});

// ============================================================================
// WARNING MESSAGES
// ============================================================================
export const WARNING_MESSAGES = Object.freeze({
  // Confirmations
  DELETE_POST_CONFIRM: "Are you sure you want to delete this post?",
  DELETE_USER_CONFIRM: (username) =>
    `Are you sure you want to delete user "${username}"? This action cannot be undone.`,
});

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
});

// ============================================================================
// LABELS - Form Labels and UI Labels
// ============================================================================
export const LABELS = Object.freeze({
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
  CANONICAL_URL: "Canonical URL (optional)",
  FEATURED_IMAGE_URL: "Featured Image URL",
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
  // Platform Names
  PLATFORM_MEDIUM: "Medium",
  PLATFORM_DEVTO: "DEV.to",
  PLATFORM_WORDPRESS: "WordPress",
  // Accessibility Labels
  HIDE_API_KEY: "Hide API key",
  SHOW_API_KEY: "Show API key",
  // Table Headers
  TABLE_TITLE: "Title",
  TABLE_STATUS: "Status",
  TABLE_TAGS: "Tags",
  TABLE_PUBLISHED_ON: "Published On",
  TABLE_CREATED: "Created",
  TABLE_ACTIONS: "Actions",
  TABLE_USER: "User",
  TABLE_EMAIL: "Email",
  TABLE_ROLE: "Role",
  TABLE_JOINED: "Joined",
  TABLE_LAST_LOGIN: "Last Login",
});

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
  CANONICAL_URL: "https://yourblog.com/post-url",
  PLACEHOLDER_CANONICAL_URL: "https://yourblog.com/post-url",
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
});

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
  PUBLISH_TO_ALL: "Publish to All",
  REMOVE_FROM_MEDIUM: "Remove from Medium",
  REMOVE_FROM_DEVTO: "Remove from DEV.to",
  REMOVE_FROM_WORDPRESS: "Remove from WordPress",
  // Settings
  SAVE_CREDENTIALS: "Save Credentials",
  // Auth
  SIGN_IN: "Sign In",
  SIGN_UP: "Sign Up",
  CREATE_ACCOUNT: "Create Account",
  // Dashboard
  CREATE_FIRST_POST: "Create Your First Post",
  CLEAR_FILTER: "Clear filter",
  SHOW_PREVIEW: "Show Preview",
  HIDE_PREVIEW: "Hide Preview",
});

// ============================================================================
// PAGE TITLES
// ============================================================================
export const PAGE_TITLES = Object.freeze({
  DASHBOARD: "Dashboard",
  USER_MANAGEMENT: "User Management",
  PROFILE_SETTINGS: "Profile Settings",
  SETTINGS: "Settings",
  EDIT_POST: "Edit Post",
  NEW_POST: "New Post",
  SIGN_IN: "Sign In",
  SIGN_UP: "Sign Up",
  CREATE_ACCOUNT: "Create your account",
  WELCOME_BACK: "Welcome back",
});

// ============================================================================
// PAGE DESCRIPTIONS
// ============================================================================
export const PAGE_DESCRIPTIONS = Object.freeze({
  DASHBOARD: "Manage your blog posts and publishing status",
  USER_MANAGEMENT: "Manage users and their permissions",
  PROFILE_SETTINGS: "Manage your account information and security settings",
  SETTINGS: "Configure your API credentials and platform settings",
  UPDATE_POST: "Update your blog post",
  CREATE_POST: "Create a new blog post",
  EDITOR_SUBTITLE: "Write and preview your blog post in Markdown.",
  SIGN_IN: "Sign in to your account to continue",
  SIGN_IN_FORM: "Enter your credentials to access your account",
  JOIN_SYNCAPP: "Join SyncApp to start publishing your blog posts",
  FILL_DETAILS: "Fill in your details to create an account",
});

// ============================================================================
// MODAL TITLES & DESCRIPTIONS
// ============================================================================
export const MODAL_TITLES = Object.freeze({
  ADD_NEW_USER: "Add New User",
  EDIT_USER: "Edit User",
  DELETE_USER: "Delete User",
  DELETE_POST: "Delete Post",
  CONFIRM_ACTION: "Confirm Action",
});

export const MODAL_DESCRIPTIONS = Object.freeze({
  CREATE_NEW_USER_ACCOUNT: "Create a new user account",
  EDITING_USER: (name) => `Editing: ${name}`,
});

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
  SIGNING_IN: "Signing in...",
  CREATING_ACCOUNT: "Creating account...",
  CHANGING_PASSWORD: "Changing Password...",
  // Dashboard
  TOTAL_POSTS: "Total Posts",
  PUBLISHED: "Published",
  DRAFTS: "Drafts",
  PLATFORMS: "Platforms",
  ALL_POSTS: "All Posts",
  NO_POSTS_YET: "No posts yet. Create your first post to get started!",
  SHOWING_POSTS: (count) => `Showing ${count} post${count === 1 ? "" : "s"}`,
  NO_POSTS_TITLE: "No posts yet",
  NO_POSTS_DESCRIPTION: "Start writing your first blog post to get published on Medium and DEV.to",
  // User Management
  ALL_USERS: "All Users",
  NO_USERS_FOUND: "No users found",
  NO_USERS_FOUND_DESCRIPTION: "Try adjusting your search or filter criteria",
  SHOWING_USERS: (showing, total) => `Showing ${showing} of ${total} user${total === 1 ? "" : "s"}`,
  PAGE_OF: (page, pages) => `Page ${page} of ${pages}`,
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
  TAGS_HELP: "Tags help with discoverability on DEV.to and other platforms",
  CANONICAL_URL_HELP: "Original source URL for SEO purposes",
  CANONICAL_URL_HINT: "Points syndicated posts back to your original article.",
  // AI Assistant (AI Sandwich)
  AI_ASSISTANT: "AI Assistant",
  AI_ASSISTANT_HINT: "SEO outline → draft → add humor (keywords preserved)",
  AI_KEYWORD_PLACEHOLDER: "e.g. blog syndication, React hooks",
  AI_GENERATE_OUTLINE: "Generate outline",
  AI_GENERATE_DRAFT: "Generate draft",
  AI_MAKE_FUNNIER: "Make it Funnier",
  AI_TONE: "Tone",
  AI_TONE_LOW: "Subtle",
  AI_TONE_MEDIUM: "Medium",
  AI_TONE_HIGH: "Playful",
  AI_OUTLINE_LABEL: "Outline",
  AI_LOADING: "Generating…",
  // PostCard/PostRow
  PUBLISHED_ON: "Published On:",
  CREATED: "Created:",
  PUBLISHED_DATE: "Published:",
  HAS_COVER_IMAGE: "📷 Has cover image",
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
  // Auth
  DONT_HAVE_ACCOUNT: "Don't have an account?",
  SIGN_UP_HERE: "Sign up here",
  ALREADY_HAVE_ACCOUNT: "Already have an account?",
  SIGN_IN_HERE: "Sign in here",
  COPYRIGHT: "© 2025 SyncApp. All rights reserved.",
  // Form Helpers
  PASSWORD_OPTIONAL: "(optional - default will be generated)",
  REQUIRED_FIELD: "*",
});

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
  // Publishing
  INVALID_MEDIUM_API_KEY: "Invalid Medium API key",
  INVALID_DEVTO_API_KEY: "Invalid DEV.to API key",
  INVALID_WORDPRESS_API_KEY: "Invalid WordPress API key",
  FAILED_TO_PUBLISH_ANY_PLATFORM: "Failed to publish to any platform",
  // Encryption
  FAILED_TO_ENCRYPT: "Failed to encrypt data",
  FAILED_TO_DECRYPT: "Failed to decrypt data",
});

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
});

// ============================================================================
// GROUPED UI EXPORTS - For easier imports and better organization
// ============================================================================

/**
 * All UI Labels - Form labels, table headers, status labels
 * Usage: import { UI_LABELS } from '@/constants';
 */
export const UI_LABELS = Object.freeze({
  ...LABELS,
});

/**
 * All UI Placeholders - Input placeholders
 * Usage: import { UI_PLACEHOLDERS } from '@/constants';
 */
export const UI_PLACEHOLDERS = Object.freeze({
  ...PLACEHOLDERS,
});

/**
 * All Button Labels - Button text
 * Usage: import { UI_BUTTONS } from '@/constants';
 */
export const UI_BUTTONS = Object.freeze({
  ...BUTTON_LABELS,
});

/**
 * All UI Titles - Page titles, modal titles, toast titles
 * Usage: import { UI_TITLES } from '@/constants';
 */
export const UI_TITLES = Object.freeze({
  ...PAGE_TITLES,
  ...MODAL_TITLES,
  ...TOAST_TITLES,
});

/**
 * All UI Descriptions - Page descriptions, modal descriptions
 * Usage: import { UI_DESCRIPTIONS } from '@/constants';
 */
export const UI_DESCRIPTIONS = Object.freeze({
  ...PAGE_DESCRIPTIONS,
  ...MODAL_DESCRIPTIONS,
});

/**
 * All User Messages - Success, error, warning, validation, info messages
 * Usage: import { UI_MESSAGES } from '@/constants';
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
 * Usage: import { SERVER_MESSAGES } from '@/constants';
 */
export const SERVER_MESSAGES = Object.freeze({
  ...SERVER_ERROR_MESSAGES,
  ...SERVER_SUCCESS_MESSAGES,
});

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
