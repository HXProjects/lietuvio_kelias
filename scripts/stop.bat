@echo off
echo Stopping Lithuanian Vocabulary Builder...
echo.

REM Kill all Node.js processes
taskkill /IM node.exe /F >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo ✅ All servers stopped successfully!
) else (
    echo ℹ️  No Node.js processes were running.
)

echo.
pause