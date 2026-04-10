# SyncApp Server - Backend API

> Express.js backend API server for SyncApp - Multi-Platform Blog Syndication Platform

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v22.0.0 or higher
- **MongoDB**: MongoDB Atlas account (or local MongoDB)
- **npm** or **yarn**

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Generate encryption keys (if needed):**

   ```bash
   node ../scripts/generate-keys.js
   ```

   Copy the output keys for the next step.

3. **Configure environment variables:**

   ```bash
   cp env.example .env
   ```

   Edit `.env` with your values:

   ```bash
   NODE_ENV=development
   PORT=9000

   # MongoDB (required)
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/syncapp

   # JWT Secret (required)
   JWT_SECRET=your_secure_random_string_here

   # Encryption Keys (required)
   ENCRYPTION_KEY=your_generated_encryption_key
   ENCRYPTION_IV=your_generated_iv_key

   # CORS (optional - defaults to http://localhost:3000)
   CORS_ORIGIN=http://localhost:3000

   # Rate Limiting (optional)
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Set up the database:**

   ```bash
   npm run db:setup
   ```

5. **Start the server:**

   ```bash
   # Development (with auto-reload)
   npm run dev

   # Production
   npm start
   ```

   The API will be available at <http://localhost:9000>

   Health check: <http://localhost:9000/health>

## 📦 Available Scripts

- `npm start` - Start server in production mode
- `npm run dev` - Start server with nodemon (auto-reload)
- `npm run db:setup` - Initialize MongoDB database schema

## 🔧 Configuration

### Required Environment Variables

| Variable | Description | Example |
| --- | --- | --- |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/syncapp` |
| `JWT_SECRET` | Secret for JWT tokens (min 32 chars) | `your_random_secure_string` |
| `ENCRYPTION_KEY` | 32-byte hex string for credential encryption | `hex_string_32_bytes` |
| `ENCRYPTION_IV` | 16-byte hex string for encryption IV | `hex_string_16_bytes` |

### Optional Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `9000` |
| `CORS_ORIGIN` | Allowed CORS origin(s), comma-separated | `http://localhost:3000` |
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `GOOGLE_CLOUD_PROJECT` | Google Cloud project ID (optional if using GOOGLE_CREDENTIALS_JSON) | _(not set)_ |
| `GOOGLE_CLOUD_LOCATION` | Vertex AI region | `us-central1` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON (for local development) | _(not set)_ |
| `GOOGLE_CREDENTIALS_JSON` | Raw JSON string of service account (for Vercel deployment) | _(not set)_ |
| `GOOGLE_AI_MODEL` or `GEMINI_MODEL` | Gemini model override | `gemini-3-flash-preview` |
| `AI_USE_GOOGLE_SEARCH_RETRIEVAL` | Use Google Search grounding for outline (SEO) | `true` |

## 🏗️ Tech Stack

- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Joi** - Input validation
- **Axios** - HTTP client for external APIs

## 📁 Project Structure

```
server/
├── api/
│   └── index.js             # Vercel serverless entry (wraps src/index.js)
├── src/
│   ├── config/              # Configuration management
│   │   └── index.js
│   ├── constants/           # Application constants
│   │   ├── index.js         # Central exports
│   │   ├── messages.js      # Error/success messages
│   │   ├── userRoles.js     # User roles
│   │   ├── httpStatus.js    # HTTP status codes
│   │   ├── http.js          # HTTP method/header constants
│   │   ├── defaultValues.js # Default configurations
│   │   ├── defaultPasswords.js
│   │   ├── validation.js    # Validation rules
│   │   ├── database.js      # Database constants
│   │   ├── api.js           # External API URLs
│   │   ├── fields.js        # Field name constants
│   │   ├── platformConfig.js
│   │   ├── mdx.js           # MDX export config
│   │   └── ai.js            # AI prompts and config
│   ├── controllers/         # Route controllers
│   ├── services/            # Business logic
│   ├── models/              # Mongoose models
│   ├── routes/              # Express routes
│   ├── middleware/          # Custom middleware (errorHandler, validator)
│   ├── utils/               # Utility functions
│   │   ├── auth.js          # JWT utilities
│   │   ├── encryption.js    # Credential encryption
│   │   ├── cache.js         # In-memory caching
│   │   └── logger.js        # Logging utilities
│   ├── database/            # Database management
│   │   ├── connection.js    # MongoDB connection
│   │   └── setup.js         # Initial database setup
│   └── index.js             # Server entry point
├── env.example              # Environment template
├── vercel.json              # Vercel serverless config
└── package.json
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update profile
- `PUT /api/auth/change-password` - Change password

### Users (admin only)

- `POST /api/users` - Create user
- `GET /api/users` - List users (paginated, filterable)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

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

### Export

- `GET /api/mdx/:id` - Export post as MDX

### AI (AI Sandwich – auth required)

- `POST /api/ai/outline` - Generate SEO outline from keyword (body: `{ keyword }`)
- `POST /api/ai/draft` - Generate draft from outline (body: `{ outline }`)
- `POST /api/ai/comedian` - Add humor to content (body: `{ content, tone? }`, tone: low/medium/high)
- `POST /api/ai/generate` - Full chain: outline → draft → comedian (body: `{ keyword, tone?, skipComedian? }`)

Requires `GOOGLE_CLOUD_PROJECT` and credentials (`GOOGLE_APPLICATION_CREDENTIALS` pointing to a service account file locally, or `GOOGLE_CREDENTIALS_JSON` containing the raw JSON for Vercel). Enable the [Vertex AI API](https://console.cloud.google.com/apis/library/aiplatform.googleapis.com) for your project. If not set, requests return 503.

### System

- `GET /health` - Health check

## 🔐 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure authentication with expiration
- **Credential Encryption**: AES-256-CBC encryption for stored platform credentials
- **CORS Protection**: Configurable origin restrictions
- **Rate Limiting**: Prevent abuse (100 requests per 15 minutes)
- **Helmet.js**: Security headers
- **Input Validation**: Joi schemas prevent injection attacks

## 🚀 Deployment

### Vercel (Serverless)

Vercel supports serverless functions for Express apps. The server is configured to work automatically with Vercel.

1. **Push to GitHub**

2. **Import in Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import your repository
   - **Root Directory**: `server` (important!)

3. **Configure Build Settings:**
   - **Framework Preset**: Other (or leave empty)
   - **Build Command**: `npm install` (or leave empty, Vercel auto-detects)
   - **Output Directory**: Leave empty (not used for serverless)
   - **Install Command**: `npm install`

4. **Set Environment Variables** (Required):

   In Vercel Dashboard → Project Settings → Environment Variables, add all required variables:

   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/syncapp
   JWT_SECRET=your_secure_random_string_here_min_32_chars
   ENCRYPTION_KEY=your_32_byte_hex_string_here
   ENCRYPTION_IV=your_16_byte_hex_string_here
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend-url.vercel.app,https://sync-app-client.vercel.app
   GOOGLE_CREDENTIALS_JSON={"type":"service_account","project_id":"..."}
   PORT=9000
   ```

   **Important Notes:**
   - Set `NODE_ENV=production` for production
   - Set `CORS_ORIGIN` to your frontend URL(s), comma-separated
   - Can set different values for Production, Preview, and Development environments
   - Vercel automatically sets `VERCEL=1` environment variable

5. **Deploy**
   - Click "Deploy"
   - Vercel will automatically detect the serverless function configuration
   - Your API will be available at: `https://your-project.vercel.app/api/*`
   - Health check: `https://your-project.vercel.app/health`

**Note:** The server automatically detects Vercel environment and exports the Express app as a serverless function. MongoDB connections are handled efficiently for serverless cold starts.

### Railway/Render

1. Create service from GitHub repository
2. **Root Directory**: `server`
3. **Build Command**: `npm ci`
4. **Start Command**: `npm start`
5. Set all environment variables in platform settings

### Heroku

1. Set Heroku app directory to `server`
2. Set buildpack: `heroku/nodejs`
3. Configure environment variables
4. Deploy

### Docker (Example)

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 9000
CMD ["npm", "start"]
```

## 🔍 Health Check

```bash
curl http://localhost:9000/health
```

Returns system status, database connection, and uptime.

## 📝 Notes

- The server is a standalone REST API
- All routes are prefixed with `/api`
- Authentication is JWT-based with Bearer tokens
- Database setup script creates indexes and validates connection
- Encryption keys must be generated before first use

## 🔍 Troubleshooting

**Server won't start:**

- Check MongoDB connection string
- Ensure all required environment variables are set
- Verify port 9000 is available

**CORS errors:**

- Update `CORS_ORIGIN` in `.env` to match frontend URL
- Ensure client and server ports match configuration

**Database connection fails:**

- Verify MongoDB URI is correct
- Check network/firewall settings
- Ensure MongoDB Atlas IP whitelist includes your IP
- For Vercel: Check that MongoDB Atlas allows connections from all IPs (0.0.0.0/0) or add Vercel IP ranges

**Vercel deployment issues:**

- Ensure `vercel.json` exists in the server directory
- Check that `api/index.js` exists
- Verify all environment variables are set in Vercel Dashboard
- Check Vercel function logs for detailed error messages
- Ensure Root Directory is set to `server` in Vercel project settings

**Encryption errors:**

- Regenerate encryption keys if needed
- Ensure keys are correct hex strings (32 bytes for key, 16 bytes for IV)
