# SyncApp Client - Frontend Application

> React frontend for SyncApp - Multi-Platform Blog Syndication Platform

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v22.0.0 or higher
- **npm** or **yarn**

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment variables:**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your backend API URL:

   ```bash
   VITE_API_BACKEND_URL=http://localhost:9000/api
   ```

3. **Start development server:**

   ```bash
   npm run dev
   ```

   The app will be available at <http://localhost:3000>

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 📦 Available Scripts

- `npm run dev` - Start Vite dev server on port 3000
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file (or `.env`) with:

- `VITE_API_BACKEND_URL` - Backend API URL (default: uses proxy to `http://localhost:9000/api`)

### Development Proxy

In development, the Vite server proxies `/api` requests to the backend automatically. You only need to set `VITE_API_BACKEND_URL` in production or if your backend runs on a different URL.

## 🏗️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router v6** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **React Quill** - Rich text editor
- **React Markdown** - Markdown preview
- **React Icons** - Icon library

## 📁 Project Structure

```
client/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── ui/         # Base UI components
│   │   └── dashboard/  # Dashboard components
│   ├── pages/          # Page components
│   ├── contexts/       # React contexts (Auth, Theme)
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── constants/      # App constants
│   └── main.jsx        # Entry point
├── index.html
├── vite.config.js
└── package.json
```

## 🔗 Backend Connection

The frontend connects to the backend API. Make sure:

1. The backend server is running (see `../server/README.md`)
2. CORS is properly configured on the backend
3. The API URL matches in your `.env.local` file

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**

2. **Import in Vercel:**

   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import your repository
   - Framework: **Vite** (auto-detected)

3. **Configure Build Settings:**

   - **Build Command:** `npm run build` (or `npm run build:vercel`)
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Set Environment Variables** (Required for Production):

   In Vercel Dashboard → Project Settings → Environment Variables, add:

   ```
   VITE_API_BACKEND_URL=https://your-backend-api.com/api
   ```

   **Important:**

   - Use your **production backend URL** (e.g., `https://sync-app-server.railway.app/api`)
   - Must include the `/api` suffix
   - Can add for specific environments (Production, Preview, Development)
   - For multiple environments, set the same variable for all environments with different values

5. **Deploy**
   - Click "Deploy"
   - Vercel will automatically detect Vite and build your app
   - Environment variables are injected at build time

### Other Platforms

- **Netlify**: Similar to Vercel, supports Vite
- **Cloudflare Pages**: Works with Vite builds
- **Static Hosting**: Build with `npm run build` and serve the `dist/` directory

## 📝 Notes

- The frontend is a standalone SPA that communicates with the backend API
- Authentication tokens are stored in `localStorage`
- The app uses JWT-based authentication
- All API calls go through the centralized `apiClient.js`

## 🔍 Troubleshooting

**API calls fail:**

- Check backend is running on the configured port
- Verify `VITE_API_BACKEND_URL` is correct
- Check browser console for CORS errors
- Ensure backend CORS allows your frontend origin

**Build fails:**

- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be v22+)
