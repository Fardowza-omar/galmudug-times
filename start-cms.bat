@echo off
REM The Record CMS - Quick Start Script

echo.
echo ======================================
echo   The Record — CMS Quick Start
echo ======================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo ✓ Node.js found
node --version
echo.

REM Navigate to API folder
cd api

echo Installing dependencies...
echo.

REM Install dependencies
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ======================================
echo   ✓ Installation Complete!
echo ======================================
echo.
echo Starting The Record CMS Server...
echo.

REM Start the server
call npm start
