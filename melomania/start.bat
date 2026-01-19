@echo off
chcp 65001 >nul
echo.
echo ========================================
echo        MeloMania v7.4.0 - Start
echo ========================================
echo.

:: Check if node_modules exists AND has vite
if not exist "node_modules\.bin\vite.cmd" (
    echo [INFO] Installing dependencies...
    echo.
    echo This may take a few minutes, please wait...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Installation failed!
        echo Please check your internet connection and Node.js installation.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencies installed successfully!
    echo.
)

:: Check if Electron is properly installed
if not exist "node_modules\electron\dist\electron.exe" (
    echo [WARNING] Electron not found, reinstalling...
    echo.
    call npm install electron@28.2.0 --force
    if not exist "node_modules\electron\dist\electron.exe" (
        echo.
        echo [ERROR] Electron installation failed!
        echo Try running fix-electron.bat
        pause
        exit /b 1
    )
    echo [OK] Electron installed!
    echo.
)

echo [INFO] Starting MeloMania...
echo.
echo The app will open in a new window.
echo.

:: Start in development mode
call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start!
    echo.
    echo Trying to fix...
    rd /s /q node_modules 2>nul
    call npm install
    call npm run dev
    
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Still failing. Please report this issue.
        pause
        exit /b 1
    )
)

pause
