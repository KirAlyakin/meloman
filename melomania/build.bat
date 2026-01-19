@echo off
echo.
echo ========================================
echo          MeloMania - Build
echo ========================================
echo.

:: Check node_modules
if not exist "node_modules" (
    echo [ERROR] Dependencies not installed!
    echo.
    echo Please run install.bat first
    echo.
    pause
    exit /b 1
)

echo [INFO] Building production version...
echo This may take a few minutes...
echo.

call npm run build

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo        Build completed!
echo ========================================
echo.
echo The application is in the dist/ folder
echo.

:: Open dist folder
if exist "dist" (
    echo Opening output folder...
    explorer dist
)

pause
