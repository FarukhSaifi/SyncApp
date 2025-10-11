# SyncApp - Multi-Platform Blog Syndication Platform

> Write once, publish everywhere. A modern full-stack application for syndicating blog posts across Medium, DEV.to, and WordPress.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)](https://nodejs.org/) [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://www.mongodb.com/cloud/atlas)

## 🌟 Features

- **Multi-Platform Publishing**: Publish to Medium, DEV.to, and WordPress from a single interface
- **Rich Text Editor**: Built-in Quill editor with Markdown support and live preview
- **User Authentication**: Secure JWT-based authentication with role management
- **Platform Credentials Management**: Encrypted storage of API keys
- **Tag Management**: SEO-friendly tagging system for better discoverability
- **Cover Images & Canonical URLs**: Professional post metadata support
- **MDX Export**: Export posts as MDX files for static site generators
- **Dark Mode**: Built-in theme support with persistent preferences
- **Real-time Updates**: Live post status across all platforms
- **Performance Optimized**: Caching, memoization, and code splitting
- **Responsive Design**: Mobile-first UI with Tailwind CSS

## 🏗️ Architecture

### Tech Stack

**Frontend:**

- React 18 with Vite
- React Router v6 for routing
- Axios for API calls
- Tailwind CSS for styling
- React Quill for rich text editing
- React Markdown for preview
- React Icons (Feather Icons)

**Backend:**

- Node.js with Express
- MongoDB with Mongoose ODM
- JWT for authentication
- Joi for validation
- Bcrypt for password hashing
- Axios for external API calls

**Infrastructure:**

- MongoDB Atlas (database)
- Vercel/Railway (deployment options)
- GitHub (version control)

### Project Structure

```text
SyncApp/
├── client/                      # React frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/            # Base UI components (Button, Card, etc.)
│   │   │   ├── dashboard/     # Dashboard-specific components
│   │   │   ├── Layout.jsx     # App layout with navigation
│   │   │   ├── ErrorBoundary.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/             # Page components
│   │   │   ├── Dashboard.jsx  # Main dashboard
│   │   │   ├── Editor.jsx     # Post editor
│   │   │   ├── Settings.jsx   # Platform settings
│   │   │   ├── Profile.jsx    # User profile
│   │   │   ├── Login.jsx      # Login page
│   │   │   └── Register.jsx   # Registration page
│   │   ├── contexts/          # React contexts
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── usePosts.js
│   │   │   ├── useToast.js
│   │   │   ├── useDebounce.js
│   │   │   └── useIntersectionObserver.js
│   │   ├── utils/             # Utility functions
│   │   │   ├── apiClient.js
│   │   │   └── performance.js
│   │   ├── constants/         # App constants
│   │   ├── App.jsx           # Root component
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Global styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                      # Express backend API
│   ├── src/
│   │   ├── config/            # Configuration management
│   │   │   └── index.js       # Centralized config with env validation
│   │   ├── controllers/       # Route controllers
│   │   │   ├── postsController.js
│   │   │   ├── credentialsController.js
│   │   │   └── publishController.js
│   │   ├── services/          # Business logic layer
│   │   │   ├── postsService.js
│   │   │   ├── credentialsService.js
│   │   │   └── publishService.js
│   │   ├── models/            # Mongoose models
│   │   │   ├── User.js
│   │   │   ├── Post.js
│   │   │   └── Credential.js
│   │   ├── routes/            # Express routes (slim handlers)
│   │   │   ├── auth.js
│   │   │   ├── posts.js
│   │   │   ├── credentials.js
│   │   │   ├── publish.js
│   │   │   └── mdx.js
│   │   ├── middleware/        # Custom middleware
│   │   │   ├── errorHandler.js
│   │   │   └── validator.js
│   │   ├── utils/             # Utility functions
│   │   │   ├── auth.js        # JWT utilities
│   │   │   ├── encryption.js  # AES-256 encryption
│   │   │   ├── logger.js      # Logging system
│   │   │   └── cache.js       # In-memory cache
│   │   ├── database/          # Database setup
│   │   │   ├── connection.js
│   │   │   └── setup.js
│   │   └── index.js           # Server entry point
│   ├── env.example            # Environment variables template
│   └── package.json
│
├── scripts/                     # Utility scripts
│   └── generate-keys.js       # Generate encryption keys
│
├── DEPLOYMENT.md                # Deployment guide
├── OPTIMIZATION.md              # Performance optimization docs
├── AUTHENTICATION.md            # Authentication documentation
├── WORDPRESS_INTEGRATION.md     # WordPress setup guide
├── API.md                       # API documentation
├── CHANGELOG.md                 # Version history
├── LICENSE                      # MIT License
├── package.json                 # Root workspace config
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v22.0.0 or higher
- **MongoDB**: MongoDB Atlas account (or local MongoDB)
- **Git**: For version control
- **API Keys** (optional for publishing):
  - Medium Integration Token
  - DEV.to API Key
  - WordPress Application Password

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/FarukhSaifi/SyncApp.git
   cd SyncApp
   ```

2. **Install dependencies:**

   ```bash
   npm run install:all
   ```

   This installs dependencies for root, server, and client.

3. **Generate encryption keys:**

   ```bash
   node scripts/generate-keys.js
   ```

   Copy the output keys for the next step.

4. **Configure environment variables:**

   **Server (`server/.env`):**

   ```bash
   # Copy example file
   cp server/env.example server/.env

   # Edit with your values:
   NODE_ENV=development
   PORT=9000

   # MongoDB (required)
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/syncapp

   # JWT Secret (required)
   JWT_SECRET=your_secure_random_string_here

   # Encryption Keys (from generate-keys.js)
   ENCRYPTION_KEY=your_generated_encryption_key
   ENCRYPTION_IV=your_generated_iv_key

   # CORS (optional in development)
   CORS_ORIGIN=http://localhost:3000

   # Rate Limiting (optional)
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

5. **Set up the database:**

   ```bash
   npm run db:setup
   ```

6. **Start the development servers:**

   ```bash
   npm run dev
   ```

   This starts both frontend (port 3000) and backend (port 9000).

7. **Open your browser:**
   - Frontend: <http://localhost:3000>
   - Backend API: <http://localhost:9000>
   - Health Check: <http://localhost:9000/health>

## 📦 Available Scripts

### Root Scripts

- `npm run dev` - Start both client and server concurrently
- `npm run dev:client` - Start client only
- `npm run dev:server` - Start server only with nodemon
- `npm run install:all` - Install all dependencies
- `npm run db:setup` - Initialize MongoDB database
- `npm run build` - Build client for production

### Server Scripts (from `server/` directory)

- `npm run dev` - Start server with nodemon (auto-reload)
- `npm start` - Start server in production mode
- `npm run db:setup` - Initialize database schema and seed data

### Client Scripts (from `client/` directory)

- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔐 Authentication & User Management

SyncApp includes a complete authentication system:

- **User Registration**: Create account with username, email, password
- **User Login**: JWT-based authentication
- **Protected Routes**: Routes require authentication
- **Profile Management**: Update user info, change password
- **Session Management**: Token stored in localStorage
- **Role-Based Access**: User/Admin roles (extensible)

See [AUTHENTICATION.md](./AUTHENTICATION.md) for detailed documentation.

## 📝 Core Functionality

### 1. Create Posts

- Write posts in rich text or Markdown
- Add tags for better discoverability
- Upload cover images
- Set canonical URLs for SEO

### 2. Manage Posts

- View all posts with filtering (all, published, drafts)
- Edit existing posts
- Delete posts
- Track publishing status across platforms

### 3. Publish to Platforms

**Medium:**

- One-click publish to Medium
- Automatic author ID detection
- Track published URL and status

**DEV.to:**

- Publish with tags and cover images
- Support for canonical URLs
- Community engagement tracking

**WordPress:**

- Direct publication to WordPress sites
- Category assignment
- Custom post metadata

**Multi-Platform:**

- Publish to all platforms simultaneously
- Individual platform status tracking
- Error handling per platform

### 4. Platform Configuration

- Securely store API credentials (encrypted)
- Manage credentials for each platform
- Toggle platform activation
- Test connections

### 5. Export & Portability

- Export posts as MDX files
- Frontmatter with metadata
- Compatible with static site generators

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update profile
- `PUT /api/auth/change-password` - Change password

### Posts

- `GET /api/posts` - List posts (paginated)
- `GET /api/posts/:id` - Get specific post
- `GET /api/posts/slug/:slug` - Get post by slug
- `POST /api/posts` - Create post (auth required)
- `PUT /api/posts/:id` - Update post (auth required)
- `DELETE /api/posts/:id` - Delete post (auth required)

### Credentials

- `GET /api/credentials` - List all credentials
- `GET /api/credentials/:platform` - Get platform credentials
- `PUT /api/credentials/:platform` - Save/update credentials
- `DELETE /api/credentials/:platform` - Delete credentials

### Publishing

- `POST /api/publish/medium` - Publish to Medium
- `POST /api/publish/devto` - Publish to DEV.to
- `POST /api/publish/wordpress` - Publish to WordPress
- `POST /api/publish/all` - Publish to all platforms
- `GET /api/publish/medium/status/:postId` - Get status

### Export

- `GET /api/mdx/:id` - Export post as MDX

### System

- `GET /health` - Health check with system info

See [API.md](./API.md) for complete API documentation with examples.

## ⚡ Performance Optimizations

SyncApp is optimized for performance with:

- **Backend Caching**: In-memory cache with TTL for frequently accessed data
- **Database Optimization**: Lean queries, proper indexing, field projection
- **Frontend Memoization**: React.memo for expensive components
- **Code Splitting**: Lazy loading for all routes
- **Debouncing**: Search and filter optimization
- **Error Handling**: Comprehensive error handling with custom error types
- **Request Validation**: Joi schemas for all inputs
- **Logging**: Structured logging with performance tracking

**Performance Metrics:**

- API Response Time: ~90ms (40% improvement)
- Dashboard Render: ~45ms (44% improvement)
- Bundle Size: ~280KB (38% reduction)
- Memory Usage: ~85MB (29% reduction)

See [OPTIMIZATION.md](./OPTIMIZATION.md) for detailed information.

## 🛡️ Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure authentication with expiration
- **API Key Encryption**: AES-256-CBC encryption for stored credentials
- **CORS Protection**: Configurable origin restrictions
- **Rate Limiting**: Prevent abuse (100 requests per 15 minutes)
- **Helmet.js**: Security headers
- **Input Validation**: Joi schemas prevent injection attacks
- **Environment Variables**: Sensitive data in .env files

## 🎨 User Interface

- **Modern Design**: Clean, professional interface with shadcn/ui components
- **Dark Mode**: Persistent theme switching
- **Responsive**: Mobile-first design works on all devices
- **Toast Notifications**: Real-time feedback for all actions
- **Loading States**: Clear feedback during operations
- **Error Handling**: User-friendly error messages
- **Accessibility**: ARIA labels and keyboard navigation

## 📚 Documentation

- **[API.md](./API.md)** - Complete API reference
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guides for Vercel, Railway, etc.
- **[AUTHENTICATION.md](./AUTHENTICATION.md)** - Authentication system documentation
- **[OPTIMIZATION.md](./OPTIMIZATION.md)** - Performance optimization details
- **[WORDPRESS_INTEGRATION.md](./WORDPRESS_INTEGRATION.md)** - WordPress setup guide
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history

## 🔧 Configuration

### Server Environment Variables

Required variables in `server/.env`:

```bash
# Server
NODE_ENV=development
PORT=9000

# Database (Required)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/syncapp

# Authentication (Required)
JWT_SECRET=your_random_secure_string_min_32_chars

# Encryption (Required - generate with scripts/generate-keys.js)
ENCRYPTION_KEY=your_32_byte_hex_string
ENCRYPTION_IV=your_16_byte_hex_string

# CORS (Optional - defaults to localhost:3000)
CORS_ORIGIN=http://localhost:3000

# Rate Limiting (Optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Client Environment Variables

Optional variables in `client/.env.local`:

```bash
# API URL (optional - uses proxy in development)
VITE_API_BACKEND_URL=http://localhost:9000/api

# App Configuration
VITE_APP_NAME=SyncApp
VITE_APP_VERSION=1.0.0
```

## 🧪 Testing

### Manual Testing Checklist

1. **Server Health:**

   ```bash
   curl http://localhost:9000/health
   ```

2. **Register User:**

   ```bash
   curl -X POST http://localhost:9000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","email":"test@example.com","password":"test123","firstName":"Test","lastName":"User"}'
   ```

3. **Create Post:**
   - Login to app at <http://localhost:3000>
   - Navigate to "New Post"
   - Fill in title and content
   - Save draft or publish

## 🚀 Deployment

### Option 1: Vercel (Recommended)

1. **Push to GitHub**
2. **Import in Vercel** → Framework: Other
3. **Configure Build:**
   - Build Command: `cd client && npm ci && npm run build`
   - Output Directory: `client/dist`
4. **Set Environment Variables** (see Configuration section)
5. **Deploy**

### Option 2: Railway/Render

1. **Create Service** from GitHub repository
2. **Root Directory**: `server`
3. **Build Command**: `npm ci`
4. **Start Command**: `npm start`
5. **Set Environment Variables**

### Option 3: Docker (Coming Soon)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🔗 Platform Integration

### Medium

1. Go to <https://medium.com/me/settings>
2. Scroll to "Integration tokens"
3. Generate token
4. Add to SyncApp Settings

### DEV.to

1. Go to <https://dev.to/settings/account>
2. Scroll to "API Keys"
3. Generate API key
4. Add to SyncApp Settings with your username

### WordPress

1. Install JWT Authentication plugin
2. Generate Application Password
3. Add site URL and password to SyncApp Settings

See [WORDPRESS_INTEGRATION.md](./WORDPRESS_INTEGRATION.md) for WordPress setup.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add JSDoc comments for functions
- Write meaningful commit messages
- Test thoroughly before submitting
- Update documentation if needed

## 🐛 Troubleshooting

### Common Issues

**Server won't start:**

- Check MongoDB connection string
- Ensure all environment variables are set
- Verify port 9000 is available

**CORS errors:**

- Update `CORS_ORIGIN` in server/.env
- Ensure client and server ports match configuration

**API calls fail:**

- Verify Vite proxy is configured (development)
- Check server is running on port 9000
- Check browser console for detailed errors

**Authentication issues:**

- Clear localStorage and try again
- Check JWT_SECRET is set
- Verify token hasn't expired

### Debug Mode

Enable detailed logging:

**Backend:**

```bash
NODE_ENV=development npm run dev:server
```

**Frontend:** Open browser DevTools → Console for detailed API logs

## 📊 Monitoring & Health

### Health Check Endpoint

```bash
GET http://localhost:9000/health
```

Returns:

```json
{
  "status": "OK",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 3600.5,
  "environment": "development",
  "database": {
    "status": "connected",
    "host": "cluster0.mongodb.net",
    "name": "syncapp"
  },
  "services": {
    "mongodb": "healthy",
    "server": "healthy"
  }
}
```

## 📈 Roadmap

### v1.1 (Planned)

- [ ] Image upload and management
- [ ] Post scheduling
- [ ] Draft autosave
- [ ] Collaborative editing
- [ ] Analytics dashboard

### v1.2 (Planned)

- [ ] Hashnode integration
- [ ] Ghost CMS support
- [ ] Social media sharing
- [ ] Email newsletter integration
- [ ] Advanced SEO tools

### v2.0 (Future)

- [ ] Team collaboration
- [ ] Content calendar
- [ ] AI-powered writing assistance
- [ ] Multi-language support
- [ ] Mobile app

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - Frontend framework
- [Express](https://expressjs.com/) - Backend framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component inspiration
- [Vite](https://vitejs.dev/) - Build tool

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/FarukhSaifi/SyncApp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/FarukhSaifi/SyncApp/discussions)
- **Email**: <support@syncapp.com> (if applicable)

## 👨‍💻 Author

Farukh Saifi

- GitHub: [@FarukhSaifi](https://github.com/FarukhSaifi)

Made with ❤️ for the developer community

**SyncApp** - Write once, publish everywhere 🚀
