#!/bin/bash
# Claude Code usage line installer for macOS. Double-click in Finder, or run:
#   bash install.command
cd "$(dirname "$0")" || exit 1

echo
echo " Claude Code usage line installer (macOS)"
echo " - CLI status line:   ~/.claude/statusline.js"
echo " - Desktop app mod:   ~/.claude/mods/usage-footer"
echo

# A Finder double-click may not load the shell profile: add the usual places.
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$HOME/.claude/local:$PATH"
if ! command -v node >/dev/null 2>&1 && [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
fi

finish() {
  echo
  read -r -p " Press Enter to close..." _
  exit "$1"
}

if ! command -v node >/dev/null 2>&1; then
  echo " ERROR: Node.js is not installed. Install it from https://nodejs.org and run this again."
  finish 1
fi

if ! node install.js; then
  echo
  echo " ERROR: install.js failed. See the message above."
  finish 1
fi

if command -v claude >/dev/null 2>&1; then
  echo
  echo " Claude Code version:"
  claude --version
  echo " Checking the mod..."
  claude plugin validate "$HOME/.claude/mods/usage-footer"
else
  echo
  echo " NOTE: the claude CLI is not on PATH, so the mod check was skipped."
fi

echo
echo " DONE."
echo " - Desktop app: open a NEW session. The usage line shows beside the model name."
echo " - CLI: restart claude to see the status line."
echo " - Needs Claude Code 2.1.287 or later."
finish 0
