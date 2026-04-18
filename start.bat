@echo off
cd /d "%~dp0"
echo Starting dev server on http://localhost:3001
echo Press Ctrl+C to stop.
echo.
npm run dev
pause
