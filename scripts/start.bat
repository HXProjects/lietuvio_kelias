@echo off
echo Starting Lithuanian Vocabulary Builder...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm dependencies are installed
if not exist node_modules (
    echo Installing dependencies...
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo Starting servers...
echo.

REM Kill any existing Node processes to ensure clean start
taskkill /IM node.exe /F >nul 2>&1

REM Start TTS server in background
echo Starting TTS Server on port 3001...
start "TTS Server" /MIN cmd /c "node texttospeech/tts-server.js"

REM Wait a moment for TTS server to start
timeout /t 3 /nobreak >nul

REM Start main server with CORS support
echo Starting Main Server on port 8080...
echo.
echo ========================================
echo Lithuanian Vocabulary Builder is ready!
echo ========================================
echo.
echo Vocabulary Builder: http://localhost:8080/index.html
echo Conjugation Trainer: http://localhost:8080/conjugation.html
echo.
echo The CORS issue has been fixed! JSON topics should now load properly.
echo.
echo Press Ctrl+C to stop the servers
echo.

node server/server.js