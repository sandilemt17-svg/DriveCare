@echo off
cd /d "%~dp0"
if not exist node_modules\vite\bin\vite.js (
  echo Installing the project packages for the first run...
  call npm install
  if errorlevel 1 (
    echo Package installation failed. Check that Node.js and npm are installed and try again.
    pause
    exit /b 1
  )
)
start "DriveCare services" cmd /k "cd /d ""%~dp0"" && npm run dev"
timeout /t 3 /nobreak >nul
start "" http://127.0.0.1:4173/
