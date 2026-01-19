@echo off
chcp 65001 >nul
echo.
echo ========================================
echo        MeloMania - Installation
echo ========================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo.
    echo Please download and install Node.js from https://nodejs.org
    echo Recommended version: 18 or higher.
    echo.
    pause
    exit /b 1
)

:: Show Node.js version
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js found: %NODE_VERSION%
echo.

:: Install dependencies
echo [INFO] Installing dependencies...
echo This may take a few minutes...
echo.

call npm install

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install dependencies!
    echo Try running as Administrator.
    pause
    exit /b 1
)

echo.
echo ========================================
echo      Installation completed!
echo ========================================
echo.
echo To start the app, run: start.bat
echo To build production: build.bat
echo.
pause
