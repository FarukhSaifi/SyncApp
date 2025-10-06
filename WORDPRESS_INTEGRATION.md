# 🌐 WordPress Integration Guide

## Overview

SyncApp now includes full WordPress integration, allowing you to publish your blog posts directly to your WordPress site. This integration uses the WordPress REST API with JWT authentication for secure publishing.

## 🚀 Features

- **Direct Publishing**: Publish posts from SyncApp to WordPress instantly
- **Rich Content Support**: Full markdown content with proper formatting
- **Media Support**: Cover images and featured media
- **SEO Integration**: Canonical URLs and meta data
- **Category Management**: Automatic tag-to-category conversion
- **Status Control**: Publish as draft or published posts

## ⚙️ Setup Requirements

### 1. WordPress Site Requirements

- **WordPress Version**: 5.0 or higher
- **REST API**: Must be enabled (enabled by default in modern WordPress)
- **JWT Authentication**: Requires the JWT Authentication plugin

### 2. Required WordPress Plugin

Install and activate the **JWT Authentication for WP REST API** plugin:

```bash
# Option 1: Via WordPress Admin
1. Go to WordPress Admin → Plugins → Add New
2. Search for "JWT Authentication for WP REST API"
3. Install and activate the plugin

# Option 2: Manual Installation
1. Download from: https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/
2. Upload to /wp-content/plugins/
3. Activate in WordPress Admin
```

### 3. WordPress Configuration

After installing the plugin, you may need to add this to your `wp-config.php`:

```php
define('JWT_AUTH_SECRET_KEY', 'your-secret-key-here');
define('JWT_AUTH_CORS_ENABLE', true);
```

## 🔑 Getting Your WordPress API Key

### Method 1: Application Passwords (Recommended)

1. Go to **WordPress Admin → Users → Your Profile**
2. Scroll down to **Application Passwords**
3. Enter a name (e.g., "SyncApp Integration")
4. Click **Add New Application Password**
5. Copy the generated password
6. Use format: `username:password` as your API key

### Method 2: User Credentials

- **Username**: Your WordPress username
- **Password**: Your WordPress password
- **Format**: `username:password`

⚠️ **Security Note**: Application passwords are more secure than using your main password.

## ⚙️ Configuration in SyncApp

### 1. Go to Settings

Navigate to **Settings** in your SyncApp dashboard.

### 2. WordPress Integration Section

Fill in the required fields:

- **WordPress Site URL**: Your WordPress site URL (e.g., `https://yoursite.com`)
- **WordPress API Key**: Your API key in `username:password` format

### 3. Save Credentials

Click **Save Credentials** to store your WordPress configuration.

## 📝 Publishing to WordPress

### 1. Create or Edit a Post

Use the rich text editor to create your blog post content.

### 2. Publish Options

You have several publishing options:

- **Publish to WordPress**: Publishes only to WordPress
- **Publish to All**: Publishes to all configured platforms
- **Save Draft**: Saves locally without publishing

### 3. Publishing Process

When you publish to WordPress:

1. **Content Processing**: Markdown content is converted to HTML
2. **API Call**: Post is sent to WordPress via REST API
3. **Status Update**: Post status is updated in SyncApp
4. **Confirmation**: Success message with WordPress post URL

## 🔧 API Endpoints

### WordPress Publish Endpoint

```
POST /api/publish/wordpress
```

**Request Body:**
```json
{
  "postId": "your_post_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Post published to WordPress successfully",
  "data": {
    "postId": "your_post_id",
    "wordpressPostId": "wordpress_post_id",
    "wordpressUrl": "https://yoursite.com/post-url",
    "status": "published"
  }
}
```

### WordPress Credentials Endpoint

```
PUT /api/credentials/wordpress
```

**Request Body:**
```json
{
  "api_key": "username:password",
  "site_url": "https://yoursite.com"
}
```

## 📊 Post Data Mapping

### Content Mapping

| SyncApp Field | WordPress Field | Description |
|---------------|----------------|-------------|
| `title` | `title` | Post title |
| `content_markdown` | `content` | Post content (converted to HTML) |
| `tags` | `categories` | Post categories |
| `cover_image` | `featured_media` | Featured image |
| `canonical_url` | `meta.canonical_url` | Canonical URL for SEO |

### Status Mapping

- **Draft**: `draft` (saved locally)
- **Published**: `publish` (live on WordPress)

## 🎨 Content Formatting

### Markdown Support

Your markdown content is automatically converted to HTML:

- **Headers**: `# H1`, `## H2`, `### H3`
- **Bold**: `**text**` → `<strong>text</strong>`
- **Italic**: `*text*` → `<em>text</em>`
- **Links**: `[text](url)` → `<a href="url">text</a>`
- **Images**: `![alt](url)` → `<img src="url" alt="alt">`
- **Lists**: `- item` → `<ul><li>item</li></ul>`

### Media Handling

- **Cover Images**: Automatically set as featured media
- **Inline Images**: Preserved in content
- **Image URLs**: Must be publicly accessible

## 🔒 Security Features

### Authentication

- **JWT Tokens**: Secure API authentication
- **Encrypted Storage**: API keys are encrypted in database
- **User Isolation**: Each user can only access their own posts

### Data Validation

- **Input Sanitization**: All content is properly sanitized
- **URL Validation**: Site URLs are validated
- **Content Length**: Reasonable limits on content size

## 🐛 Troubleshooting

### Common Issues

#### 1. "WordPress API credentials not found"

**Solution**: Configure WordPress credentials in Settings

#### 2. "WordPress site URL not configured"

**Solution**: Add your WordPress site URL in the credentials

#### 3. "WordPress API Error: 401 Unauthorized"

**Possible Causes**:
- Invalid username/password
- JWT plugin not activated
- Incorrect API key format

**Solutions**:
- Verify your credentials
- Check JWT plugin activation
- Use `username:password` format

#### 4. "WordPress API Error: 404 Not Found"

**Possible Causes**:
- REST API disabled
- Incorrect site URL
- WordPress version too old

**Solutions**:
- Enable REST API in WordPress
- Verify site URL
- Update WordPress to 5.0+

### Debug Steps

1. **Check WordPress Site**:
   - Visit `https://yoursite.com/wp-json/wp/v2/posts`
   - Should return JSON response

2. **Verify JWT Plugin**:
   - Check if plugin is active
   - Verify plugin settings

3. **Test API Key**:
   - Try logging in with credentials
   - Check application password validity

4. **Check SyncApp Logs**:
   - Review server console for errors
   - Check browser console for client errors

## 📱 User Interface

### Settings Page

- **WordPress Integration Card**: Blue-themed integration section
- **Site URL Field**: Input for WordPress site URL
- **API Key Field**: Secure password field for API credentials
- **Help Information**: Step-by-step setup guide
- **Status Indicator**: Shows connection status

### Editor Page

- **WordPress Publish Button**: Dedicated WordPress publishing
- **Publish to All**: Includes WordPress in multi-platform publishing
- **Status Updates**: Real-time publishing status

### Dashboard

- **Platform Status**: Shows WordPress publishing status
- **Post Links**: Direct links to published WordPress posts
- **Status Indicators**: Visual indicators for each platform

## 🔮 Future Enhancements

### Planned Features

- **Scheduled Publishing**: Set future publish dates
- **Draft Sync**: Sync WordPress drafts back to SyncApp
- **Media Library**: Upload and manage media files
- **Category Management**: Create and manage WordPress categories
- **Template Support**: Custom post templates
- **Revision History**: Track post changes

### Advanced Features

- **Multi-Site Support**: Publish to multiple WordPress sites
- **Custom Fields**: Support for custom post meta
- **SEO Optimization**: Advanced SEO meta data
- **Social Sharing**: Automatic social media integration
- **Analytics**: Publishing analytics and insights

## 📚 Additional Resources

### WordPress Documentation

- [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)
- [JWT Authentication Plugin](https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/)
- [WordPress Developer Resources](https://developer.wordpress.org/)

### SyncApp Resources

- [Authentication System](AUTHENTICATION.md)
- [API Documentation](API.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)

## 🆘 Support

### Getting Help

1. **Check Documentation**: Review this guide and other docs
2. **Troubleshooting**: Follow the troubleshooting steps above
3. **Community**: Join our community forums
4. **Support**: Contact support team for complex issues

### Reporting Issues

When reporting issues, please include:

- **SyncApp Version**: Current version number
- **WordPress Version**: WordPress site version
- **Error Messages**: Exact error text
- **Steps to Reproduce**: Detailed reproduction steps
- **Screenshots**: Visual evidence of the issue

---

**Note**: This WordPress integration provides a robust foundation for cross-platform publishing. Always test with a staging site before publishing to production.
