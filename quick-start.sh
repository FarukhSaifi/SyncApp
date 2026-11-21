#!/bin/bash

echo "🚀 Welcome to SyncApp - Blog Syndication Platform!"
echo "=================================================="
echo ""

# Prefer nvm when available (repo engines: Node >=24.21, npm ^11)
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    # shellcheck disable=SC1091
    . "$HOME/.nvm/nvm.sh"
    if [ -f .nvmrc ]; then
        nvm use >/dev/null 2>&1 || nvm install
    fi
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 24.21 or higher first."
    echo "   Visit: https://nodejs.org/  or: nvm install 24.21.0"
    exit 1
fi

# Check Node.js major.minor against package.json engines (>=24.21)
NODE_MAJOR=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
NODE_MINOR=$(node -v | cut -d'v' -f2 | cut -d'.' -f2)
if [ "$NODE_MAJOR" -lt 24 ] || { [ "$NODE_MAJOR" -eq 24 ] && [ "$NODE_MINOR" -lt 21 ]; }; then
    echo "❌ Node.js >=24.21.0 is required. Current: $(node -v) ($(command -v node))"
    echo "   If you use nvm: nvm use 24.21.0"
    echo "   Wrong Node (e.g. v20 + npm 10) causes: Cannot read properties of null (reading 'edgesOut')"
    exit 1
fi

echo "✅ Node.js $(node -v) / npm $(npm -v) detected"
echo ""

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. Please install MongoDB first."
    echo "   On macOS: brew install mongodb-community"
    echo "   On Ubuntu: sudo apt-get install mongodb"
    echo "   On Windows: Download from https://www.mongodb.com/try/download/community"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if MongoDB service is running
if pgrep -x "mongod" > /dev/null; then
    echo "✅ MongoDB service is running"
else
    echo "⚠️  MongoDB service is not running. Please start MongoDB first."
    echo "   On macOS: brew services start mongodb-community"
    echo "   On Ubuntu: sudo systemctl start mongodb"
    echo "   On Windows: Start MongoDB service from Services"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ MongoDB connection check passed"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Setup environment
echo "🔧 Setting up environment..."
if [ ! -f "server/.env" ]; then
    echo "📝 Creating .env file from template..."
    cp server/env.example server/.env
    echo "⚠️  Please edit server/.env with your MongoDB connection string and API keys"
    echo ""
    read -p "Press Enter after updating the .env file..."
else
    echo "✅ .env file already exists"
fi

# Setup database
echo "🗄️  Setting up database..."
cd server
npm run db:setup

if [ $? -ne 0 ]; then
    echo "❌ Database setup failed. Please check your MongoDB connection and credentials."
    exit 1
fi

cd ..
echo "✅ Database setup completed"
echo ""

echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit server/.env with your MongoDB connection string and Medium API key"
echo "2. Run 'npm run dev' to start both servers"
echo "3. Open http://localhost:5173 in your browser"
echo ""
echo "Happy blogging! 🚀"
