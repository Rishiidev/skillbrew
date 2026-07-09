---
name: skillbrew
description: Backup, restore, sync and bundle the user's Claude Code setup (skills, plugins, agents, connectors, config). Use when the user says "backup my skills", "snapshot my setup", "restore my skills", "sync my claude setup", "install skill pack", "export skills for claude.ai", or after a reset when their skills are gone.
---

# skillbrew — Claude setup manager

CLI lives at `~/skillbrew` (or wherever the user cloned https://github.com/Rishiidev/skillbrew).
Run commands with: `node <skillbrew-dir>/bin/skillbrew.js <command>`

| User intent | Command |
|---|---|
| Back up everything | `skillbrew snapshot` |
| Rebuild after reset | `skillbrew restore` (current state auto-backed-up first, never deleted) |
| Restore one collection | `skillbrew restore --pack <name>` |
| Create a collection | `skillbrew pack create <name> <skill...>` |
| Zips for claude.ai upload | `skillbrew export --chat` |
| Install someone's bundle | `skillbrew install github:user/repo [--pack <name>]` |
| Show what's tracked | `skillbrew list` |

First-time setup: `skillbrew init [dir] [--github]` (default `~/skillbrew-backup`; `--github` creates a private remote via `gh`).

Notes for the agent:
- After restore, tell the user to restart Claude Code and walk them through the printed re-auth checklist (OAuth/API keys are never stored in the backup).
- Secrets live only in `secrets.local.json` (gitignored). Never commit or print its contents.
- If `skillbrew` errors with "No backup repo configured", run `skillbrew init` first.
