#!/bin/bash

echo "🚀 Welcome to SyncApp - Blog Syndication Platform!"
echo "=================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
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
