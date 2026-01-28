@echo off
REM Quick setup script for CyberAttacksNews (Windows)

echo.
echo 🚀 CyberAttacksNews Setup Script
echo ================================
echo.

echo 📦 Installing dependencies...
call npm install

echo.
echo 🔨 Building TypeScript...
call npm run build

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo   npm run test        - Run tests
echo   npm run dev         - Start development server
echo   npm start           - Start production server
echo   npm run cli         - Run CLI tool
echo.
echo Documentation:
echo   - README.md         - Quick start
echo   - SETUP.md          - Development guide
echo   - ARCHITECTURE.md   - Detailed design
