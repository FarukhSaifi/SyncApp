# 🔐 Authentication System Documentation

## Overview

SyncApp now includes a complete authentication system that allows users to register, login, and manage their own blog posts securely. Each user can only access and modify their own posts.

## 🚀 Features

### User Authentication

- **User Registration**: Create new accounts with username, email, and password
- **User Login**: Secure authentication with JWT tokens
- **Password Management**: Change passwords securely
- **Profile Management**: Update personal information and bio

### Security Features

- **JWT Tokens**: Secure, stateless authentication
- **Password Hashing**: Bcrypt encryption for password security
- **Protected Routes**: API endpoints require valid authentication
- **User Isolation**: Users can only access their own posts

### User Management

- **User Profiles**: Personal information, bio, and avatar
- **Role-based Access**: User and admin roles (admin role not yet implemented)
- **Session Management**: Automatic token validation and refresh

## 📋 API Endpoints

### Authentication Routes (`/api/auth`)

#### POST `/api/auth/register`

Register a new user account.

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

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "token": "jwt_token_here"
  },
  "message": "User registered successfully"
}
```

#### POST `/api/auth/login`

Authenticate existing user.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "token": "jwt_token_here"
  },
  "message": "Login successful"
}
```

#### GET `/api/auth/me`

Get current user profile (requires authentication).

**Headers:**

```
Authorization: Bearer <jwt_token>
```

#### PUT `/api/auth/me`

Update user profile (requires authentication).

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "bio": "Updated bio information",
  "avatar": "https://example.com/avatar.jpg"
}
```

#### PUT `/api/auth/change-password`

Change user password (requires authentication).

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### Protected Posts Routes (`/api/posts`)

All posts endpoints now require authentication and are user-scoped.

#### GET `/api/posts`

Get all posts for the authenticated user.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

#### POST `/api/posts`

Create a new post (automatically assigned to authenticated user).

**Headers:**

```
Authorization: Bearer <jwt_token>
```

#### PUT `/api/posts/:id`

Update a post (only if user owns the post).

**Headers:**

```
Authorization: Bearer <jwt_token>
```

#### DELETE `/api/posts/:id`

Delete a post (only if user owns the post).

**Headers:**

```
Authorization: Bearer <jwt_token>
```

## 🔧 Frontend Implementation

### Authentication Context

The app uses React Context for global authentication state management:

```jsx
import { useAuth } from "../contexts/AuthContext";

const { user, login, logout, isAuthenticated } = useAuth();
```

### Protected Routes

Components are wrapped with `ProtectedRoute` to ensure authentication:

```jsx
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

### API Calls with Authentication

All API calls include the JWT token in headers:

```jsx
const token = localStorage.getItem("token");
const response = await fetch("/api/posts", {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
});
```

## 🛡️ Security Features

### JWT Token Security

- **Expiration**: Tokens expire after 7 days (configurable)
- **Secret Key**: Secure random secret key for token signing
- **Stateless**: No server-side session storage needed

### Password Security

- **Bcrypt Hashing**: 12-round salt for password encryption
- **Minimum Length**: 6 character minimum password requirement
- **Secure Storage**: Passwords never stored in plain text

### API Security

- **Authentication Required**: Protected endpoints require valid tokens
- **User Isolation**: Users can only access their own data
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API rate limiting to prevent abuse

## 🚀 Getting Started

### 1. Start the Servers

```bash
# Start backend server
npm run dev:server

# Start frontend client
npm run dev:client
```

### 2. Register a New User

- Navigate to `/register`
- Fill in your details
- Create your account

### 3. Login

- Navigate to `/login`
- Use your email and password
- Access your dashboard

### 4. Create Blog Posts

- Use the rich text editor
- Save drafts or publish directly
- Manage your content

## 🔒 Environment Variables

Ensure these environment variables are set in `server/.env`:

```env
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRES_IN=7d
MONGODB_URI=your_mongodb_connection_string
```

## 📱 User Interface

### Authentication Pages

- **Login**: Clean, modern login form with validation
- **Register**: Comprehensive registration with field validation
- **Profile**: User profile management and password changes

### Protected Dashboard

- **User Menu**: Profile dropdown with logout option
- **Post Management**: Create, edit, and delete your posts
- **Rich Text Editor**: Professional blog writing experience

## 🧪 Testing

### Test User Account

You can test the system with these credentials:

- **Email**: test@example.com
- **Password**: password123

### API Testing

Use tools like Postman or curl to test the API endpoints:

```bash
# Test registration
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🔮 Future Enhancements

- **Email Verification**: Email confirmation for new accounts
- **Password Reset**: Forgot password functionality
- **Social Login**: OAuth integration (Google, GitHub)
- **Admin Panel**: User management for administrators
- **Two-Factor Authentication**: Enhanced security options

## 🐛 Troubleshooting

### Common Issues

1. **"Access token required"**: Ensure you're sending the Authorization header
2. **"Invalid or expired token"**: Token may have expired, re-login required
3. **"Access denied"**: You don't have permission to access this resource
4. **"User not found"**: User account may have been deleted

### Debug Steps

1. Check browser console for errors
2. Verify JWT token in localStorage
3. Ensure server is running on port 3001
4. Check MongoDB connection
5. Verify environment variables are set

---

**Note**: This authentication system provides a solid foundation for user management. Always follow security best practices in production deployments.
