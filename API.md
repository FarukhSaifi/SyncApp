# SyncApp API Documentation

## Overview

SyncApp is a blog syndication platform that allows users to write posts and publish them to multiple platforms (Medium, DEV.to, WordPress). This document describes the REST API endpoints available in the backend server.

**Base URL:** `http://localhost:9000/api` (development)  
**Content-Type:** `application/json`  
**Authentication:** Bearer Token (JWT)

---

## Authentication

### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

**Error Responses:**

- `400 Bad Request` - User already exists
- `500 Internal Server Error` - Registration failed

---

### Login User

Authenticate user and receive JWT token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid credentials
- `500 Internal Server Error` - Login failed

---

### Get Current User Profile

Get the authenticated user's profile information.

**Endpoint:** `GET /api/auth/me`

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Software developer and blogger",
    "avatar": "https://example.com/avatar.jpg",
    "role": "user",
    "isVerified": false,
    "lastLogin": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - User not found

---

### Update User Profile

Update the authenticated user's profile information.

**Endpoint:** `PUT /api/auth/me`

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Updated bio",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Updated bio",
    "avatar": "https://example.com/new-avatar.jpg",
    "role": "user",
    "isVerified": false,
    "lastLogin": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  },
  "message": "Profile updated successfully"
}
```

---

### Change Password

Change the authenticated user's password.

**Endpoint:** `PUT /api/auth/change-password`

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**

- `400 Bad Request` - Current password is incorrect
- `401 Unauthorized` - Invalid or missing token

---

## Posts

### Get Posts

Retrieve posts with pagination. Returns user's posts if authenticated, public posts if not.

**Endpoint:** `GET /api/posts`

**Query Parameters:**

- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Posts per page (default: 20, max: 100)

**Headers (optional):**

```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "64f1a2b3c4d5e6f7g8h9i0j2",
      "title": "Getting Started with React",
      "slug": "getting-started-with-react",
      "status": "published",
      "tags": ["react", "javascript", "tutorial"],
      "cover_image": "https://example.com/cover.jpg",
      "canonical_url": "https://example.com/post",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z",
      "author": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "username": "johndoe",
        "firstName": "John",
        "lastName": "Doe"
      },
      "platform_status": {
        "medium": {
          "published": true,
          "post_id": "medium123",
          "url": "https://medium.com/@johndoe/getting-started-with-react",
          "published_at": "2024-01-15T10:30:00.000Z"
        },
        "devto": {
          "published": false,
          "post_id": null,
          "url": null,
          "published_at": null
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### Get Post by ID

Retrieve a specific post by its ID.

**Endpoint:** `GET /api/posts/:id`

**Headers (optional):**

```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "title": "Getting Started with React",
    "slug": "getting-started-with-react",
    "content_markdown": "# Getting Started with React\n\nReact is a JavaScript library...",
    "status": "published",
    "tags": ["react", "javascript", "tutorial"],
    "cover_image": "https://example.com/cover.jpg",
    "canonical_url": "https://example.com/post",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z",
    "author": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe"
    },
    "platform_status": {
      "medium": {
        "published": true,
        "post_id": "medium123",
        "url": "https://medium.com/@johndoe/getting-started-with-react",
        "published_at": "2024-01-15T10:30:00.000Z"
      }
    }
  }
}
```

**Error Responses:**

- `404 Not Found` - Post not found
- `403 Forbidden` - Access denied (trying to access draft post without authentication)

---

### Get Post by Slug

Retrieve a specific post by its slug.

**Endpoint:** `GET /api/posts/slug/:slug`

**Headers (optional):**

```
Authorization: Bearer <jwt_token>
```

**Response:** Same as Get Post by ID

---

### Create Post

Create a new blog post.

**Endpoint:** `POST /api/posts`

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "title": "My New Blog Post",
  "content_markdown": "# My New Blog Post\n\nThis is the content...",
  "status": "draft",
  "tags": ["javascript", "tutorial"],
  "cover_image": "https://example.com/cover.jpg",
  "canonical_url": "https://example.com/original-post"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j3",
    "title": "My New Blog Post",
    "slug": "my-new-blog-post",
    "content_markdown": "# My New Blog Post\n\nThis is the content...",
    "status": "draft",
    "tags": ["javascript", "tutorial"],
    "cover_image": "https://example.com/cover.jpg",
    "canonical_url": "https://example.com/original-post",
    "createdAt": "2024-01-15T12:00:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z",
    "author": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe"
    },
    "platform_status": {
      "medium": { "published": false, "post_id": null, "url": null, "published_at": null },
      "devto": { "published": false, "post_id": null, "url": null, "published_at": null },
      "wordpress": { "published": false, "post_id": null, "url": null, "published_at": null }
    }
  }
}
```

**Error Responses:**

- `400 Bad Request` - Missing required fields
- `401 Unauthorized` - Invalid or missing token

---

### Update Post

Update an existing blog post.

**Endpoint:** `PUT /api/posts/:id`

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "title": "Updated Blog Post Title",
  "content_markdown": "# Updated Content\n\nThis is the updated content...",
  "status": "published",
  "tags": ["javascript", "tutorial", "updated"],
  "cover_image": "https://example.com/new-cover.jpg"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j3",
    "title": "Updated Blog Post Title",
    "slug": "updated-blog-post-title",
    "content_markdown": "# Updated Content\n\nThis is the updated content...",
    "status": "published",
    "tags": ["javascript", "tutorial", "updated"],
    "cover_image": "https://example.com/new-cover.jpg",
    "canonical_url": "https://example.com/original-post",
    "createdAt": "2024-01-15T12:00:00.000Z",
    "updatedAt": "2024-01-15T13:00:00.000Z",
    "author": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe"
    }
  },
  "message": "Post updated successfully"
}
```

**Error Responses:**

- `403 Forbidden` - Not the post owner
- `404 Not Found` - Post not found

---

### Delete Post

Delete a blog post.

**Endpoint:** `DELETE /api/posts/:id`

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Post deleted"
}
```

**Error Responses:**

- `403 Forbidden` - Not the post owner
- `404 Not Found` - Post not found

---

## Credentials

### Get All Credentials

Retrieve all platform credentials for the user.

**Endpoint:** `GET /api/credentials`

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "64f1a2b3c4d5e6f7g8h9i0j4",
      "platform_name": "medium",
      "api_key": "encrypted_key_here",
      "user_id": 1,
      "is_active": true,
      "platform_config": {
        "medium_user_id": "user123"
      },
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    },
    {
      "id": "64f1a2b3c4d5e6f7g8h9i0j5",
      "platform_name": "devto",
      "api_key": "encrypted_key_here",
      "user_id": 1,
      "is_active": true,
      "platform_config": {
        "devto_username": "johndoe"
      },
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### Get Credential by Platform

Retrieve credentials for a specific platform.

**Endpoint:** `GET /api/credentials/:platform`

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**

- `platform` - Platform name (`medium`, `devto`, `wordpress`)

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j4",
    "platform_name": "medium",
    "api_key": "encrypted_key_here",
    "user_id": 1,
    "is_active": true,
    "platform_config": {
      "medium_user_id": "user123"
    },
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**

- `404 Not Found` - Credentials not found for this platform

---

### Save Credentials

Save or update platform credentials.

**Endpoint:** `PUT /api/credentials/:platform`

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**

- `platform` - Platform name (`medium`, `devto`, `wordpress`)

**Request Body:**

```json
{
  "api_key": "your_api_key_here",
  "site_url": "https://your-wordpress-site.com",
  "platform_config": {
    "devto_username": "johndoe",
    "medium_user_id": "user123"
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j4",
    "platform_name": "medium",
    "api_key": "encrypted_key_here",
    "user_id": 1,
    "is_active": true,
    "platform_config": {
      "medium_user_id": "user123"
    },
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  },
  "message": "Credentials saved successfully"
}
```

**Error Responses:**

- `400 Bad Request` - API key is required

---

### Delete Credentials

Delete platform credentials.

**Endpoint:** `DELETE /api/credentials/:platform`

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**

- `platform` - Platform name (`medium`, `devto`, `wordpress`)

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Credentials deleted successfully"
}
```

**Error Responses:**

- `404 Not Found` - Credentials not found for this platform

---

## Publishing

### Publish to Medium

Publish a post to Medium.

**Endpoint:** `POST /api/publish/medium`

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "postId": "64f1a2b3c4d5e6f7g8h9i0j3"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Post published to Medium successfully",
  "data": {
    "postId": "64f1a2b3c4d5e6f7g8h9i0j3",
    "status": "published"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Medium API credentials not found
- `404 Not Found` - Post not found
- `500 Internal Server Error` - Publishing failed

---

### Publish to DEV.to

Publish a post to DEV.to.

**Endpoint:** `POST /api/publish/devto`

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "postId": "64f1a2b3c4d5e6f7g8h9i0j3"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Post published to DEV.to successfully",
  "data": {
    "postId": "64f1a2b3c4d5e6f7g8h9i0j3",
    "status": "published"
  }
}
```

---

### Publish to WordPress

Publish a post to WordPress.

**Endpoint:** `POST /api/publish/wordpress`

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "postId": "64f1a2b3c4d5e6f7g8h9i0j3"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Post published to WordPress successfully",
  "data": {
    "postId": "64f1a2b3c4d5e6f7g8h9i0j3",
    "status": "published"
  }
}
```

---

### Publish to All Platforms

Publish a post to all configured platforms.

**Endpoint:** `POST /api/publish/all`

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "postId": "64f1a2b3c4d5e6f7g8h9i0j3"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Post published to multiple platforms",
  "data": {
    "postId": "64f1a2b3c4d5e6f7g8h9i0j3",
    "results": {
      "medium": {
        "platform_status.medium.published": true,
        "platform_status.medium.post_id": "medium123",
        "platform_status.medium.url": "https://medium.com/@johndoe/post",
        "platform_status.medium.published_at": "2024-01-15T12:00:00.000Z"
      },
      "devto": {
        "platform_status.devto.published": true,
        "platform_status.devto.post_id": "devto456",
        "platform_status.devto.url": "https://dev.to/johndoe/post",
        "platform_status.devto.published_at": "2024-01-15T12:01:00.000Z"
      }
    },
    "errors": [
      {
        "platform": "wordpress",
        "error": "WordPress API credentials not found"
      }
    ]
  }
}
```

---

### Get Medium Post Status

Get the publishing status of a post on Medium.

**Endpoint:** `GET /api/publish/medium/status/:postId`

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**

- `postId` - Post ID

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j3",
    "title": "My Blog Post",
    "platform_status": {
      "medium": {
        "published": true,
        "post_id": "medium123",
        "url": "https://medium.com/@johndoe/my-blog-post",
        "published_at": "2024-01-15T12:00:00.000Z"
      }
    }
  }
}
```

---

## MDX Export

### Export Post as MDX

Export a post as MDX format for download.

**Endpoint:** `GET /api/mdx/:id`

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**

- `id` - Post ID

**Response (200 OK):**

```
Content-Type: text/markdown; charset=utf-8
Content-Disposition: attachment; filename="2024-01-15-my-blog-post.mdx"

---
title: "My Blog Post"
date: 2024-01-15T12:00:00.000Z
tags: ['javascript', 'tutorial']
cover_image: 'https://example.com/cover.jpg'
canonical_url: 'https://example.com/original'
---

# My Blog Post

This is the content of the blog post...
```

**Error Responses:**

- `403 Forbidden` - Access denied
- `404 Not Found` - Post not found

---

## Health Check

### Server Health

Check the health status of the server and database.

**Endpoint:** `GET /health`

**Response (200 OK):**

```json
{
  "status": "OK",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "uptime": 3600.5,
  "environment": "development",
  "database": {
    "status": "connected",
    "host": "localhost",
    "name": "syncapp"
  },
  "services": {
    "mongodb": "healthy",
    "server": "healthy"
  }
}
```

---

## Error Handling

All API endpoints return consistent error responses:

**Error Response Format:**

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (development only)"
}
```

**Common HTTP Status Codes:**

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Rate Limiting

The API implements rate limiting:

- **Window:** 15 minutes
- **Limit:** 100 requests per IP address
- **Headers:** Rate limit information is included in response headers

---

## Authentication

Most endpoints require authentication using JWT tokens:

1. **Login/Register** to get a JWT token
2. **Include token** in the `Authorization` header: `Bearer <token>`
3. **Token expires** after 7 days (configurable)

**Example:**

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     http://localhost:9000/api/posts
```

---

## Development Setup

1. **Start the server:**

   ```bash
   cd server
   npm run dev
   ```

2. **Server runs on:** `http://localhost:9000`

3. **API base URL:** `http://localhost:9000/api`

4. **Health check:** `http://localhost:9000/health`

---

## Production Deployment

For production deployment, update the base URL to your deployed server URL:

- **Vercel:** `https://your-app.vercel.app/api`
- **Railway:** `https://your-app.railway.app/api`
- **Custom domain:** `https://api.yourdomain.com/api`

Make sure to set the following environment variables:

- `MONGODB_URI`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `ENCRYPTION_IV`
- `CORS_ORIGIN`
