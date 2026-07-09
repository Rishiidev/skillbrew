---
name: bunch
description: Backup, restore, sync and bundle the user's Claude Code setup (skills, plugins, agents, connectors, config). Use when the user says "backup my skills", "snapshot my setup", "restore my skills", "sync my claude setup", "install skill pack", "export skills for claude.ai", or after a reset when their skills are gone.
---

# bunch — Claude setup manager

CLI lives at `~/bunch` (or wherever the user cloned https://github.com/REPLACE_ME/bunch).
Run commands with: `node <bunch-dir>/bin/bunch.js <command>`

| User intent | Command |
|---|---|
| Back up everything | `bunch snapshot` |
| Rebuild after reset | `bunch restore` (current state auto-backed-up first, never deleted) |
| Restore one collection | `bunch restore --pack <name>` |
| Create a collection | `bunch pack create <name> <skill...>` |
| Zips for claude.ai upload | `bunch export --chat` |
| Install someone's bundle | `bunch install github:user/repo [--pack <name>]` |
| Show what's tracked | `bunch list` |

First-time setup: `bunch init [dir] [--github]` (default `~/bunch-backup`; `--github` creates a private remote via `gh`).

Notes for the agent:
- After restore, tell the user to restart Claude Code and walk them through the printed re-auth checklist (OAuth/API keys are never stored in the backup).
- Secrets live only in `secrets.local.json` (gitignored). Never commit or print its contents.
- If `bunch` errors with "No backup repo configured", run `bunch init` first.
