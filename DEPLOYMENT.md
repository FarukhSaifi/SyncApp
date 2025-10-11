# Deployment Guide

## Overview

SyncApp is a monorepo with a React client (Vite) and an Express server using MongoDB (Atlas recommended).

**Quick Deploy (Recommended):**

1. Push to GitHub
2. Import in Vercel → Framework: **Other**
3. Set environment variables
4. Deploy (both client + server automatically)

**Architecture:**

- Client: React SPA (Vite) → Static hosting
- Server: Express API → Serverless functions
- Database: MongoDB Atlas
- Routing: `vercel.json` handles `/api/*` → server, `/*` → client

---

### 1) Prerequisites

- MongoDB Atlas connection string (recommended)
- Production secrets: `JWT_SECRET`, `ENCRYPTION_KEY`, `ENCRYPTION_IV`, `CORS_ORIGIN`
- Medium / DEV.to API keys (optional)

---

### 2) Environment Variables

Required on the server (serverless or Node):

- `NODE_ENV=production`
- `PORT=3001` (ignored on serverless)
- `MONGODB_URI` (Atlas URI)
- `JWT_SECRET`
- `ENCRYPTION_KEY` (32 bytes hex or string)
- `ENCRYPTION_IV` (16 bytes hex or string)
- `CORS_ORIGIN` (your client domain)

Optional:

- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`

Client build time variables (optional):

- Add via Vite env if exposing flags; avoid exposing secrets.

---

### 3) Deploy to Vercel (Monorepo - Recommended)

1. Push repo to GitHub
2. Import in Vercel → Framework: **Other** (not Vite)
3. Root Directory: **Leave as root** (monorepo)
4. Build Command: `cd client && npm ci && npm run build`
5. Output Directory: `client/dist`
6. **Important**: The `vercel.json` in repo root handles the routing automatically
7. Environment Variables: Set server variables (see Section 2)

**Note**: Don't use separate client/server projects. The monorepo setup with `vercel.json` handles both.

---

### 4) Alternative Deployment Options

#### A) Vercel Monorepo (Recommended - Already configured)

✅ **Already handled in Section 3** - The `vercel.json` automatically deploys both client and server.

**How it works:**

- `/api/*` routes → Express server (serverless functions)
- All other routes → React SPA
- Single domain: `https://your-app.vercel.app`

#### B) Separate Deployments

**Client only on Vercel:**

1. Create new Vercel project
2. Root Directory: `client`
3. Framework: Vite
4. Build Command: `npm run build`
5. Output Directory: `dist`

**Server on Render/Railway:**

1. Create service from repository
2. Root Directory: `server`
3. Build Command: `npm ci`
4. Start Command: `npm start`
5. Set environment variables (Section 2)
6. Update `CORS_ORIGIN` to your client URL

**Pros/Cons:**

- Monorepo: Simpler, single domain, auto-scaling
- Separate: More control, different scaling needs

---

### 5) vercel.json Configuration (Already in repo)

The `vercel.json` in your repo root is already configured:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "client/dist"
      }
    },
    {
      "src": "server/src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/src/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "client/dist/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "PORT": "3001"
  }
}
```

**This configuration:**

- Builds React app from `client/` directory
- Builds Express server from `server/src/index.js`
- Routes `/api/*` to server functions
- Routes everything else to React SPA
- Sets production environment variables

---

### 6) Production Checklist

- [ ] `MONGODB_URI` points to Atlas (production cluster)
- [ ] Strong `JWT_SECRET`
- [ ] Strong `ENCRYPTION_KEY` (32 bytes) and `ENCRYPTION_IV` (16 bytes)
- [ ] `CORS_ORIGIN` set to deployed client URL
- [ ] Rate limiting enabled (`RATE_LIMIT_*`)
- [ ] Disable any verbose logs
- [ ] Test key flows: create post, save credentials, publish to DEV.to/Medium

---

### 7) Cloud Server Changes

- Ensure health endpoint: `GET /health` returns 200
- Behind reverse proxy (NGINX) set:
  - `proxy_set_header X-Forwarded-Proto $scheme;`
  - `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`
- Set `TRUST_PROXY=1` in server if you rely on proxy IP/HTTPS (optional)
- Enable HTTPS (Let's Encrypt)

---

### 8) Troubleshooting

**Common 404 Issues:**

- **404 on all routes**: Check `vercel.json` is in repo root and properly formatted
- **404 on `/api/*`**: Verify server build succeeded, check Vercel function logs
- **404 on React routes**: Ensure `client/dist/index.html` exists, check build output
- **404 after deployment**: Clear browser cache, check Vercel deployment logs

**Other Issues:**

- **500 on DB connect**: verify `MONGODB_URI`, IP whitelist on Atlas
- **CORS errors**: check `CORS_ORIGIN` matches your Vercel domain
- **401 from Medium/DEV.to**: verify tokens, scopes
- **Serverless timeouts**: move heavy tasks to job/queue or persistent host
- **Build failures**: check environment variables are set correctly

**Debug Steps:**

1. Check Vercel deployment logs in dashboard
2. Test `/health` endpoint: `https://your-app.vercel.app/health`
3. Test API: `https://your-app.vercel.app/api/posts`
4. Check browser network tab for failed requests

---

### 9) Rollback Strategy

- Keep previous deployment alive
- Use tags (e.g., `v1.x`) and revert if needed
- Maintain seed scripts or fixtures for basic data
