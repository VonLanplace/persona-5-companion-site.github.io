@echo off
setlocal

cd /d "%~dp0"

if "%~1"=="" (
    if "%PORT%"=="" set "PORT=8080"
) else (
    set "PORT=%~1"
)

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js is required but was not found in PATH.
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo npm is required but was not found in PATH.
    exit /b 1
)

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 exit /b 1
)

call npm run verify
if errorlevel 1 exit /b 1

node _build/serve.mjs "%PORT%"
