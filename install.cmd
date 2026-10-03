@echo off
setlocal
title Claude Code usage line installer
echo.
echo  Claude Code usage line installer
echo  - CLI status line:   ~/.claude/statusline.js
echo  - Desktop app mod:   ~/.claude/mods/usage-footer
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo  ERROR: Node.js is not installed. Install it from https://nodejs.org and run this again.
  echo.
  pause
  exit /b 1
)

node "%~dp0install.js"
if errorlevel 1 (
  echo.
  echo  ERROR: install.js failed. See the message above.
  echo.
  pause
  exit /b 1
)

where claude >nul 2>nul
if errorlevel 1 (
  echo.
  echo  NOTE: the claude CLI is not on PATH, so the mod check was skipped.
) else (
  echo.
  echo  Claude Code version:
  call claude --version
  echo  Checking the mod...
  call claude plugin validate "%USERPROFILE%\.claude\mods\usage-footer"
)

echo.
echo  DONE.
echo  - Desktop app: open a NEW session. The usage line shows beside the model name.
echo  - CLI: restart claude to see the status line.
echo  - Needs Claude Code 2.1.287 or later.
echo.
pause
