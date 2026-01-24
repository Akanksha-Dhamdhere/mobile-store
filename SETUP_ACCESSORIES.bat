@echo off
REM Accessories Module - Quick Setup Script
REM This script helps fix the "Something Was Wrong" error

echo.
echo ========================================
echo  ACCESSORIES MODULE - QUICK SETUP
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "backend" (
    echo ERROR: Run this script from the project root directory!
    pause
    exit /b 1
)

echo.
echo [1/3] Checking if backend dependencies are installed...
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
    echo ✓ Backend dependencies installed
) else (
    echo ✓ Backend dependencies already installed
)

echo.
echo [2/3] Checking MongoDB connection...
cd backend
echo Testing connection... Please wait...
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGO_URI).then(() => { console.log('✓ MongoDB Connected'); mongoose.connection.close(); }).catch(err => { console.error('✗ MongoDB Connection Failed:', err.message); process.exit(1); })"

if errorlevel 1 (
    echo.
    echo WARNING: MongoDB connection failed!
    echo Please check:
    echo   1. Your internet connection
    echo   2. MongoDB Atlas account is active
    echo   3. Connection string in backend\.env is correct
    echo.
    pause
    cd ..
    exit /b 1
)

cd ..

echo.
echo [3/3] Seeding accessories data...
cd backend
node scripts/seed_accessories.js
if errorlevel 1 (
    echo.
    echo ERROR: Failed to seed accessories data!
    echo Please check the error above and try again.
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo ✓ SETUP COMPLETE!
echo ========================================
echo.
echo Next steps:
echo   1. Start backend:  cd backend && npm start
echo   2. Start frontend: npm start
echo   3. Visit:          http://localhost:3000/accessory
echo.
pause
