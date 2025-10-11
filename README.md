# SyncApp - Blog Syndication Platform

A web application that lets you write once and publish to multiple platforms (Medium, DEV.to, WordPress planned).

🚀 **Optimized for Performance** - See [OPTIMIZATION.md](./OPTIMIZATION.md) for details on caching, error handling, and performance improvements.

## Project Structure

```text
SyncApp/
├── client/                      # React (Vite) frontend
├── server/                      # Express backend (MongoDB)
│   ├── src/
│   │   ├── config/             # Centralized config (env)
│   │   ├── controllers/        # Route controllers
│   │   ├── services/           # Business logic
│   │   ├── routes/             # Express routers (slim handlers)
│   │   ├── models/             # Mongoose models
│   │   ├── utils/              # Utilities (encryption, auth, etc.)
│   │   └── index.js            # App entrypoint
│   └── env.example             # Server environment example
├── vercel.json                  # Vercel (optional) config for monorepo
├── DEPLOYMENT.md                # Deployment guide (Vercel & cloud)
├── README.md                    # This file
└── package.json                 # Workspaces and scripts
```

## Requirements

- Node.js 22+
- MongoDB Atlas (recommended) or local MongoDB

## Environment Variables

### Server Environment Variables

Copy `server/env.example` to `server/.env` and set:

- `NODE_ENV`=production | development
- `PORT`=9000
- `MONGODB_URI`=your MongoDB Atlas URI
- `JWT_SECRET`=random secure string
- `ENCRYPTION_KEY`=32-byte key (hex or string)
- `ENCRYPTION_IV`=16-byte IV (hex or string)
- `CORS_ORIGIN`=e.g., <http://localhost:3000>
- `RATE_LIMIT_WINDOW_MS`=900000
- `RATE_LIMIT_MAX_REQUESTS`=100

### Client Environment Variables

Copy `client/.env.example` to `client/.env` and set:

- `VITE_API_BASE_URL`=`http://localhost:9000/api` (backend API URL)
- `VITE_NODE_ENV`=development
- `VITE_APP_NAME`=SyncApp
- `VITE_APP_VERSION`=1.0.0
- `VITE_ENABLE_DEBUG`=false (optional)
- `VITE_ENABLE_ANALYTICS`=false (optional)

Tip: Generate secure keys with:

```bash
node scripts/generate-keys.js
```

## Install & Run

From project root:

```bash
npm run install:all
npm run db:setup
npm run dev
```

- Client: <http://localhost:5173>
- Server: <http://localhost:9000>
- Health: GET /health

## Scripts

- `npm run dev` → runs client and server
- `npm run dev:client` → runs client only
- `npm run dev:server` → runs server with nodemon
- `npm run db:setup` → initializes MongoDB schema/seed

## API (Highlights)

- Posts: `GET /api/posts`, `POST /api/posts`, `PUT /api/posts/:id`, `DELETE /api/posts/:id`
- Credentials: `PUT /api/credentials/:platform` (medium | devto | wordpress)
- Publish: `POST /api/publish/medium|devto|wordpress`, `POST /api/publish/all`

## Security

- Credentials are encrypted using AES-256-CBC with `ENCRYPTION_KEY` and `ENCRYPTION_IV`
- CORS configured via `CORS_ORIGIN`
- Helmet + rate limiting enabled

## Deployment

See `DEPLOYMENT.md` for detailed steps:

- Client on Vercel (static build)
- Server on Vercel functions or Node host (Render/Railway/Fly/EC2)
- MongoDB Atlas

## Notes

- Do not expose server secrets to the client
- Use different secrets per environment (dev/staging/prod)
