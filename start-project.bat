@echo off
setlocal enabledelayedexpansion

title Clinical Sanctuary - Emergency Alert System Launcher
cls

echo =========================================================================
echo    Clinical Sanctuary (ClinicalGuard) - Emergency Alert System
echo                   Precision in every Response
echo =========================================================================
echo.

set "PROJECT_ROOT=%~dp0"
set "SERVER_DIR=%PROJECT_ROOT%server"
set "CLIENT_DIR=%PROJECT_ROOT%client"

:: 1. Check if node and npm are available
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found on your system PATH.
    echo Please install Node.js v20+ from https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: 2. Check server dependencies
if not exist "%SERVER_DIR%\node_modules\express" (
    echo [WARNING] Server node_modules missing.
    echo Please run:  cd server ^&^& npm.cmd install
    echo.
    pause
    exit /b 1
)

:: 3. Check client dependencies
if not exist "%CLIENT_DIR%\node_modules\vite" (
    echo [WARNING] Client node_modules missing.
    echo Please run:  cd client ^&^& npm.cmd install
    echo.
    pause
    exit /b 1
)

:: 4. Check if MongoDB Service is Running
sc.exe query MongoDB | findstr /i "STATE" | findstr /i "RUNNING" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [NOTICE] MongoDB Windows Service is not running or needs to be started.
    echo Attempting: net start MongoDB ...
    net start MongoDB >nul 2>nul
)

:: 5. Check if Port 5000 (Backend) is already in use
netstat -ano | findstr /r ":5000 " | findstr /i "LISTENING" >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [INFO] Backend is already running on port 5000.
) else (
    echo [LAUNCH] Starting Express Backend Server (Port 5000)...
    start "Clinical Sanctuary - Backend (Port 5000)" cmd /k "cd /d "%SERVER_DIR%" && npm.cmd start"
)

:: 6. Check if Port 5173 (Frontend) is already in use
netstat -ano | findstr /r ":5173 " | findstr /i "LISTENING" >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [INFO] Frontend dev server is already running on port 5173.
) else (
    echo [LAUNCH] Starting Vite Frontend Server (Port 5173)...
    start "Clinical Sanctuary - Frontend (Port 5173)" cmd /k "cd /d "%CLIENT_DIR%" && npm.cmd run dev"
)

echo.
echo =========================================================================
echo [SUCCESS] Clinical Sanctuary services launched successfully!
echo.
echo Web Application: http://localhost:5173
echo Backend API:     http://localhost:5000
echo Health Endpoint: http://localhost:5000/api/health
echo.
echo Demo Accounts:
echo   - Citizen:    rahul.patient@example.com    / EmergencyPass2026!
echo   - Responder:  vikram.responder@example.com / EmergencyPass2026!
echo   - Dispatcher: anita.dispatcher@example.com / EmergencyPass2026!
echo.
echo To stop servers: Close the respective opened Command Prompt windows.
echo =========================================================================
echo.
pause
