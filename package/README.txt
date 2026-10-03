Claude Code usage line - installer for Windows and macOS
========================================================

What it installs
- Claude Code desktop app (Windows and macOS): a usage line beside the model name
    c8 | 5h 18% 3h28m | w41/55
    c  = context used
    5h = 5-hour session used, time until reset
    w  = week used / even pace for now
  Green = safe, yellow = a bit fast, red = too fast.
- Claude Code CLI (terminal): the full status line under the prompt.

Needs
- Node.js (https://nodejs.org)
- Claude Code 2.1.287 or later

WINDOWS
1. Right-click the zip > Extract All.
2. Open the extracted folder.
3. Double-click install.cmd.
   If SmartScreen shows "Windows protected your PC",
   click "More info" > "Run anyway".
4. Open a NEW session in the Claude Code desktop app.

MACOS
1. Double-click the zip in Finder. It extracts to a folder.
2. Open the folder. Right-click install.command > Open > Open.
   (A plain double-click can be blocked the first time, because the
   file is not from the App Store. Right-click > Open allows it once.)
   If it still does not run, open Terminal and type:
     bash ~/Downloads/claude-usage-line/install.command
   (change the path if the folder is somewhere else)
3. Open a NEW session in the Claude Code desktop app.

LET CLAUDE CODE INSTALL IT (both systems)
1. Extract the zip.
2. Open the Claude Code desktop app with the extracted folder as the project.
3. Paste the prompt from PROMPT.txt.

What changes on your computer
- Copies statusline.js to ~/.claude/statusline.js
  (Windows: %USERPROFILE%\.claude\statusline.js)
- Copies mods/usage-footer to ~/.claude/mods/usage-footer
- In ~/.claude/settings.json it adds, only if missing:
    "statusLine": { "type": "command", "command": "node ~/.claude/statusline.js" }
    "env": { "CLAUDE_CODE_PLUGIN_DIRS": "~/.claude/mods/usage-footer" }
  All other settings stay as they are.
- Safe to run again.

Remove
1. Delete ~/.claude/mods/usage-footer
2. Remove ~/.claude/mods/usage-footer from env.CLAUDE_CODE_PLUGIN_DIRS
   in ~/.claude/settings.json

Full details: docs/HANDOFF.md
