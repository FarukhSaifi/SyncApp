# Deployment Guide

## Overview

SyncApp is a monorepo with a React client (Vite) and an Express server using MongoDB (Atlas recommended). You can deploy:

- Client: Vercel (recommended)
- Server: Vercel Serverless Functions or a Node server (Render, Railway, Fly.io, EC2)
- Database: MongoDB Atlas

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

### 3) Deploy Client to Vercel

1. Push repo to GitHub
2. Import in Vercel → Framework: Vite
3. Build Command: `cd client && npm ci && npm run build`
4. Output Directory: `client/dist`
5. Root Directory: repository root (or `client` if you configure a separate project)
6. Environment Variables: none required for static client

After deploy, note your client URL (e.g., `https://syncapp.example.app`). Use this as `CORS_ORIGIN` for the server.

---

### 4) Deploy Server

You have two options:

#### A) Vercel Serverless (api routes)

- Create a separate Vercel project for the server, or use a monorepo setup
- Configure `vercel.json` in repo root (see below)
- Set Environment Variables (Section 2)
- Ensure `CORS_ORIGIN` matches your client URL

Endpoints will be under your Vercel domain, e.g., `https://syncapp-api.vercel.app/api/...`

Pros: autoscaling, no server mgmt Cons: cold starts, request time limits

#### B) Node Host (Render/Railway/Fly/EC2)

- Create service from the repository, set root to `server`
- Build Command: `npm ci`
- Start Command: `npm start`
- Set environment variables (Section 2)
- Configure CORS to your client URL

Pros: long-running server, full control Cons: server management, scaling plan

---

### 5) vercel.json Example (monorepo)

Place in repo root if deploying serverless on Vercel for server routes:

```
{
  "version": 2,
  "builds": [
    { "src": "client/vite.config.js", "use": "@vercel/static-build", "config": { "distDir": "client/dist" } },
    { "src": "server/src/index.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "server/src/index.js" },
    { "src": "/(.*)", "dest": "client/dist/index.html" }
  ]
}
```

Notes:

- Alternatively deploy client and server as separate Vercel projects for clean separation
- For large APIs, prefer dedicated Node hosts

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

- 500 on DB connect: verify `MONGODB_URI`, IP whitelist on Atlas
- CORS errors: check `CORS_ORIGIN`
- 401 from Medium/DEV.to: verify tokens, scopes
- Serverless timeouts: move heavy tasks to job/queue or persistent host

---

### 9) Rollback Strategy

- Keep previous deployment alive
- Use tags (e.g., `v1.x`) and revert if needed
- Maintain seed scripts or fixtures for basic data
