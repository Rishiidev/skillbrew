# Changelog

All notable changes documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [1.0.0] — 2026-07-09

### Added
- `skillbrew init [dir] [--github]` — creates a backup repo (default `~/skillbrew-backup`), with `--github` wiring up a private remote via `gh`.
- `skillbrew snapshot` — copies skills, agents, and config into the backup repo, records installed plugins + marketplaces + MCP connectors, then commits and pushes.
- `skillbrew restore [--pack <name>]` — rebuilds `~/.claude` from the backup repo; always copies the current state to `~/.claude.pre-restore-<timestamp>` first, so restores are never destructive.
- Secret redaction (`src/secrets.js`) — env values, MCP tokens, and headers are stripped from anything written to the repo and kept only in the gitignored `secrets.local.json`; restore re-merges them or prints a re-keying checklist for anything unresolved.
- Pack system (`skillbrew pack create/list/install`) — named collections of skills that can be snapshotted, exported, or installed as a group.
- `skillbrew export --chat [--pack p]` — per-skill zip files for manual upload to claude.ai → Settings → Capabilities.
- `skillbrew install <github:user/repo|url|path> [--pack p] [--force]` — installs skills from any skillbrew-format repo (clones if remote, reads `skills/`).
- `skillbrew list` — shows everything tracked with per-platform support badges (Claude Code/Desktop, claude.ai, Gemini CLI/Cursor, ChatGPT).
- Env overrides `SKILLBREW_CLAUDE_HOME`, `SKILLBREW_CLAUDE_JSON`, `SKILLBREW_REPO`, `SKILLBREW_CONFIG` for running against a fake home in tests, skipping real `claude` CLI calls.
