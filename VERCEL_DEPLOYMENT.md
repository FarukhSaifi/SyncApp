# Vercel Deployment Guide for SyncApp

## Prerequisites

1. **MongoDB Atlas Account**: You need a MongoDB Atlas cluster for production
2. **Vercel Account**: Deploy your backend to Vercel
3. **Environment Variables**: Configure all required environment variables

## Step 1: Set up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster (free tier is sufficient for development)
3. Create a database user with read/write permissions
4. Whitelist all IP addresses (0.0.0.0/0) for Vercel deployment
5. Get your connection string (should look like: `mongodb+srv://username:password@cluster.mongodb.net/syncapp`)

## Step 2: Configure Vercel Environment Variables

In your Vercel dashboard, go to your project settings and add these environment variables:

### Required Variables

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/syncapp?retryWrites=true&w=majority
JWT_SECRET=your_very_secure_jwt_secret_key_here
ENCRYPTION_KEY=your-32-character-secret-key-here!!
ENCRYPTION_IV=your-16-char-iv!!
NODE_ENV=production
```

### Optional Variables

```
CORS_ORIGIN=https://your-frontend-domain.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Step 3: Deploy to Vercel

1. **Install Vercel CLI** (if not already installed):

   ```bash
   npm i -g vercel
   ```

2. **Deploy from the project root**:

   ```bash
   vercel --prod
   ```

3. **Or connect your GitHub repository** to Vercel for automatic deployments

## Step 4: Verify Deployment

1. **Check the health endpoint**:

   ```
   GET https://your-app.vercel.app/health
   ```

2. **Expected response** (when everything is working):

   ```json
   {
     "status": "OK",
     "timestamp": "2025-01-20T15:22:49.442Z",
     "uptime": 0.79,
     "environment": "production",
     "database": {
       "status": "connected",
       "host": "cluster0.xxxxx.mongodb.net",
       "name": "syncapp",
       "readyState": 1,
       "ping": true
     },
     "services": {
       "mongodb": "healthy",
       "server": "healthy"
     }
   }
   ```

## Troubleshooting

### Database Connection Issues

If you see `"mongodb": "unhealthy"` in the health check:

1. **Verify MongoDB Atlas connection string**:

   - Make sure the username and password are correct
   - Ensure the cluster is running
   - Check that IP whitelist includes 0.0.0.0/0

2. **Check environment variables**:

   - Verify `MONGODB_URI` is set correctly in Vercel
   - Make sure there are no extra spaces or quotes

3. **Test connection locally**:

   ```bash
   # Set the production MongoDB URI in your local .env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/syncapp

   # Test the connection
   npm run dev
   ```

4. **MongoDB Driver Compatibility**:
   - If you get `MongoParseError: option buffermaxentries is not supported`, this means you're using deprecated connection options
   - The connection configuration has been updated to use only supported options for Mongoose 8.x

### Common Issues

1. **"MONGODB_URI is required" error**:

   - Make sure the environment variable is set in Vercel dashboard
   - Redeploy after adding environment variables

2. **CORS errors**:

   - Update `CORS_ORIGIN` in Vercel environment variables
   - Include your frontend domain

3. **Rate limiting**:
   - Adjust `RATE_LIMIT_MAX_REQUESTS` if needed
   - Check Vercel's own rate limits

## Environment Variables Reference

| Variable | Required | Description | Example |
| --- | --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/syncapp` |
| `JWT_SECRET` | Yes | Secret key for JWT tokens | `your-secret-key` |
| `ENCRYPTION_KEY` | Yes | 32-character encryption key | `your-32-character-secret-key-here!!` |
| `ENCRYPTION_IV` | Yes | 16-character initialization vector | `your-16-char-iv!!` |
| `NODE_ENV` | Yes | Environment mode | `production` |
| `CORS_ORIGIN` | No | Allowed CORS origins | `https://your-app.vercel.app` |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | No | Max requests per window | `100` |

## Next Steps

After successful deployment:

1. Update your frontend to use the new Vercel backend URL
2. Test all API endpoints
3. Set up monitoring and logging
4. Configure custom domain if needed
