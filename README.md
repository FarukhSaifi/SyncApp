# SyncApp - Blog Syndication Platform

A web application that allows users to write blog posts in a central dashboard and publish them to multiple platforms, starting with Medium.

## Features

- **Central Dashboard**: Write and manage blog posts
- **Markdown Editor**: Rich text editing with Markdown support
- **Multi-Platform Publishing**: Currently supports Medium, with plans for expansion
- **Secure Credential Storage**: Encrypted API key storage
- **Modern UI**: Built with shadcn/ui and Tailwind CSS

## Tech Stack

- **Backend**: Node.js + Express.js
- **Frontend**: React + Vite
- **Database**: MongoDB with Mongoose ODM
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS

## Project Structure

```
SyncApp/
├── server/          # Backend API server
├── client/          # React frontend application
├── package.json     # Root package.json with workspaces
└── README.md        # This file
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Medium API key (for publishing)

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd SyncApp
   ```

2. Install dependencies:

   ```bash
   npm run install:all
   ```

3. Set up environment variables:

   ```bash
   cp server/.env.example server/.env
   # Edit server/.env with your MongoDB connection string and API credentials
   ```

4. Set up the database:

   ```bash
   cd server
   npm run db:setup
   ```

5. Start the development servers:

   ```bash
   npm run dev
   ```

This will start both the backend server (port 3001) and frontend client (port 5173).

## API Endpoints

- `POST /api/posts` - Create a new blog post
- `GET /api/posts` - Retrieve all posts
- `PUT /api/credentials/medium` - Save Medium API credentials
- `POST /api/publish/medium` - Publish a post to Medium

## Development

- **Backend**: `npm run dev:server`
- **Frontend**: `npm run dev:client`
- **Both**: `npm run dev`

## Building for Production

```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
