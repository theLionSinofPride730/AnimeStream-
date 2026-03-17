@echo off
title AnimeStream+ Quick Setup

echo.
echo 🎌 AnimeStream+ - Quick Setup Script
echo ====================================
echo.

REM Check if npm is installed
npm -v >nul 2>&1
if errorlevel 1 (
  echo ❌ npm is not installed. Please install Node.js 18+ first.
  pause
  exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✅ npm %NPM_VERSION% detected
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
echo.

REM Create .env.local if it doesn't exist
if not exist ".env.local" (
  echo 🔧 Creating .env.local...
  (
    echo DATABASE_URL="file:./prisma/dev.db"
    echo NEXT_PUBLIC_API_URL="http://localhost:3000"
  ) > .env.local
  echo ✅ Environment variables created
) else (
  echo ✅ .env.local already exists
)
echo.

REM Initialize database
echo 🗄️  Initializing database...
call npm exec -- prisma migrate dev --name init
if %errorlevel% neq 0 (
  echo ℹ️  Database initialization skipped or in progress
)
echo.

echo ✅ Setup complete!
echo.
echo 🚀 Starting development server...
echo    Open http://localhost:3000 in your browser
echo.
call npm run dev

pause
