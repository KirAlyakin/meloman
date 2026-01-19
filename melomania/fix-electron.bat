@echo off
chcp 65001 >nul
title MeloMania - Исправление Electron

echo ========================================
echo   MeloMania - Исправление Electron
echo ========================================
echo.

echo [1/4] Удаление сломанной установки Electron...
if exist "node_modules\electron" (
    rmdir /s /q "node_modules\electron" 2>nul
    echo       Папка electron удалена
) else (
    echo       Папка electron не найдена
)

echo.
echo [2/4] Очистка кэша npm...
call npm cache clean --force >nul 2>&1
echo       Кэш очищен

echo.
echo [3/4] Переустановка Electron...
call npm install electron@28.2.0 --force
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ОШИБКА] Не удалось установить Electron
    echo Попробуйте:
    echo   1. Удалить папку node_modules полностью
    echo   2. Запустить install.bat заново
    pause
    exit /b 1
)

echo.
echo [4/4] Проверка установки...
if exist "node_modules\electron\dist\electron.exe" (
    echo.
    echo ========================================
    echo   Electron успешно установлен!
    echo ========================================
    echo.
    echo Теперь запустите start.bat
) else (
    echo.
    echo [ОШИБКА] electron.exe не найден после установки
    echo Попробуйте удалить node_modules и запустить install.bat
)

echo.
pause
