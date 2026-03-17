#!/bin/bash

echo "🎌 AnimeStream+ - Quick Setup Script"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed. Please install Node.js 18+ first."
  exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo ""

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
  echo "🔧 Creating .env.local..."
  cat > .env.local << EOF
DATABASE_URL="file:./prisma/dev.db"
NEXT_PUBLIC_API_URL="http://localhost:3000"
EOF
  echo "✅ Environment variables created"
else
  echo "✅ .env.local already exists"
fi
echo ""

# Initialize database
echo "🗄️  Initializing database..."
npm exec -- prisma migrate dev --name init || echo "Database migration skipped"
echo ""

echo "✅ Setup complete!"
echo ""
echo "🚀 Starting development server..."
echo "   Open http://localhost:3000 in your browser"
echo ""
npm run dev
