@echo off
title EMBRASTIC Business OS

cd /d "C:\Users\vshlt\embrastic"

cls

echo.
echo ==================================================
echo.
echo              EMBRASTIC BUSINESS OS
echo.
echo ==================================================
echo.
echo Starting EMBRASTIC...
echo.
echo Please keep this window open while using the app.
echo.

REM Start browser after giving Next.js time to start
start "" cmd /c "timeout /t 8 /nobreak >nul && start http://localhost:3000/login"

REM Start Next.js
npm run dev

echo.
echo ==================================================
echo EMBRASTIC has stopped.
echo ==================================================
echo.

pause