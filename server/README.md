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
   cp .env.dev.example .env.dev
   cp .env.prod.example .env.prod
   ```

   Edit `.env.dev` (and `.env.prod` for production) with your values:

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
| `GEMINI_API_KEY` | Google AI Studio API key ([get one free](https://aistudio.google.com/apikey)) — required for AI routes | _(not set)_ |
| `GOOGLE_AI_MODEL` | Gemini content model | `gemini-3.5-flash` |
| `AI_USE_GOOGLE_SEARCH_RETRIEVAL` | Use Google Search grounding for SEO posts | `true` |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID (optional — GCS cover uploads only) | _(not set)_ |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON (local GCS) | _(not set)_ |
| `GOOGLE_CREDENTIALS_JSON` | Raw service account JSON (Vercel GCS) | _(not set)_ |

## 🏗️ Tech Stack

- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
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
│   ├── middleware/          # Custom middleware (errorHandler, auth)
│   ├── utils/               # Utility functions
│   │   ├── auth.js          # JWT utilities
│   │   ├── encryption.js    # Credential encryption
│   │   ├── cache.js         # In-memory caching
│   │   └── logger.js        # Logging utilities
│   ├── database/            # Database management
│   │   ├── connection.js    # MongoDB connection
│   │   └── setup.js         # Initial database setup
│   └── index.js             # Server entry point
├── .env.dev.example         # Dev environment template
├── .env.prod.example        # Prod environment template
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

### AI (auth required) — Google AI Studio

- `GET /api/ai/capabilities` - `{ textAi, imageAi, provider, defaultModel }`
- `GET /api/ai/trending-topics` - Live topics + Google SEO keywords via Search grounding (`?refresh=1`)
- `GET /api/ai/devto-tags` - High-reach DEV.to tags from Forem `/api/tags` (`?refresh=1`)
- `POST /api/ai/generate` - Full SEO post from keyword (body: `{ keyword, model?, targetPlatforms? }`)
- `POST /api/ai/generate-image` - Featured image from topic
- `POST /api/ai/edit` - Inline edit selected text (body: `{ action, text }`)

Requires `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey). Default model: `gemini-3.5-flash`. See [docs/AI_SETUP.md](../docs/AI_SETUP.md). Without the key, AI routes return **503**.

### System

- `GET /health` - Health check

## 🔐 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure authentication with expiration
- **Credential Encryption**: AES-256-CBC encryption for stored platform credentials
- **CORS Protection**: Configurable origin restrictions
- **Rate Limiting**: Prevent abuse (100 requests per 15 minutes)
- **Helmet.js**: Security headers
- **Input Validation**: Request body checks in controllers / middleware

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

   Use the same variable names as `server/.env.prod.example`. **Checklist and copy-paste template:** [docs/VERCEL_ENV.md](../docs/VERCEL_ENV.md)

   Minimum for Production:

   ```
   MONGODB_URI=...
   JWT_SECRET=...
   ENCRYPTION_KEY=...
   ENCRYPTION_IV=...
   CORS_ORIGIN=https://your-frontend.vercel.app
   GOOGLE_CLOUD_PROJECT=...
   GOOGLE_CLOUD_LOCATION=us-central1
   GOOGLE_CREDENTIALS_JSON={"type":"service_account",...}
   ```

   **Important Notes:**
   - On Vercel use `GOOGLE_CREDENTIALS_JSON`, not `GOOGLE_APPLICATION_CREDENTIALS`
   - Do not set `PORT` or `NODE_ENV` manually — Vercel handles them
   - Set `CORS_ORIGIN` to your frontend URL(s), comma-separated
   - Can enable the same values for Production and Preview in the dashboard
   - After configuring Vercel, run `npm run env:pull` from the repo root to update local `server/.env.prod`

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

- Update `CORS_ORIGIN` in `server/.env.dev` or `server/.env.prod`
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
