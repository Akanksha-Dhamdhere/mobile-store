@echo off
REM Start the frontend dev server on Windows using cmd so PowerShell's npm.ps1 restrictions don't block it.
REM Usage from PowerShell: .\start.bat

SETLOCAL
:: Ensure environment variables used by CRA are set
SET "DANGEROUSLY_DISABLE_HOST_CHECK=true"
SET "ALLOWED_HOSTS=all"
SET "HOST=localhost"

:: Use npm.cmd explicitly to avoid PowerShell trying to run npm.ps1
npm.cmd run start
ENDLOCAL
