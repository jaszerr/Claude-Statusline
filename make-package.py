#!/usr/bin/env python3
"""Build dist/claude-usage-line.zip: the one-click installer for Windows and macOS.

Run after every change to statusline.js, install.js, the installers, or a mod:
    python make-package.py

The zip is built here (not with Compress-Archive) so that:
- install.command keeps its Unix execute bit (macOS Finder can run it)
- install.cmd and the .txt files get CRLF; install.command gets LF
- macOS resource-fork files (._*) and loader-written types are left out
"""
import os
import zipfile

ROOT = os.path.dirname(os.path.abspath(__file__))
TOP = "claude-usage-line"
OUT = os.path.join(ROOT, "dist", f"{TOP}.zip")

# (source relative to ROOT, path inside the zip)
FILES = [
    ("statusline.js", "statusline.js"),
    ("install.js", "install.js"),
    ("install.cmd", "install.cmd"),
    ("install.command", "install.command"),
    ("package/README.txt", "README.txt"),
    ("package/PROMPT.txt", "PROMPT.txt"),
    ("docs/HANDOFF.md", "docs/HANDOFF.md"),
]
CRLF = {"install.cmd", "README.txt", "PROMPT.txt"}
EXECUTABLE = {"install.command"}


def mod_files():
    mods = os.path.join(ROOT, "mods")
    for dirpath, dirnames, filenames in os.walk(mods):
        rel_dir = os.path.relpath(dirpath, ROOT).replace(os.sep, "/")
        dirnames[:] = [d for d in dirnames if not (rel_dir.endswith(".claude-plugin") and d == "types")]
        for name in filenames:
            if name.startswith("._") or name == ".DS_Store":
                continue
            rel = f"{rel_dir}/{name}"
            yield rel, rel


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        for src, dest in FILES + list(mod_files()):
            with open(os.path.join(ROOT, src), "rb") as f:
                data = f.read().replace(b"\r\n", b"\n")
            if dest in CRLF:
                data = data.replace(b"\n", b"\r\n")
            info = zipfile.ZipInfo(f"{TOP}/{dest}", date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = 3  # Unix, so the mode bits below are honored
            mode = 0o755 if dest in EXECUTABLE else 0o644
            info.external_attr = (0o100000 | mode) << 16
            z.writestr(info, data)
            print(f"  {dest}")
    print(f"Built {OUT} ({os.path.getsize(OUT)} bytes)")


if __name__ == "__main__":
    main()
