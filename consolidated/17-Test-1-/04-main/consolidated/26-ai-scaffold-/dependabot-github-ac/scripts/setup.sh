#!/bin/bash

# Dalek Linear Evolution - Setup Script

echo "🚀 Setting up Dalek Linear Evolution..."
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

echo "✅ All prerequisites met"
echo ""

# Create environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "⚠️  Please edit .env and add your API keys"
    echo ""
fi

# Install dependencies (if using npm/yarn)
if [ -f package.json ]; then
    echo "📦 Installing dependencies..."
    if command -v npm &> /dev/null; then
        npm install
    elif command -v yarn &> /dev/null; then
        yarn install
    elif command -v pnpm &> /dev/null; then
        pnpm install
    else
        echo "⚠️  No package manager found"
    fi
fi

echo ""
echo "✅ Setup complete!"
echo "📝 Next steps:"
echo "   1. Edit .env and add your API keys"
echo "   2. Run: npm start (or open index.html in browser)"
