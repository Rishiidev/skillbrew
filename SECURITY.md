# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✓ |

## Reporting a Vulnerability

Do not open a public issue for security vulnerabilities.
Open a [GitHub Issue](https://github.com/Rishiidev/skillbrew/issues/new) with the prefix `[SECURITY]`.

Include: description, steps to reproduce, potential impact.
Response within 72 hours. Resolution within 7 days for confirmed issues.

## Scope

- **Secret leakage into the backup repo** — `snapshot` redacts env values, MCP tokens, and headers before writing anything to the backup repo (`src/secrets.js`); a bug that lets a real credential slip through into a committed/pushed file is in scope.
- **Arbitrary code via `skillbrew install <github:user/repo|url|path>`** — this command clones an untrusted repo and copies its `skills/` contents straight into `~/.claude/skills`. Skills can contain executable instructions/scripts that Claude Code will later run. Issues around insufficient warning, path handling, or unsafe defaults here are in scope.
- **Path traversal in `restore` / `install`** — a skill or pack name (or contents inside a cloned repo) that escapes the intended destination directory (e.g. via `../`) during copy is in scope.
- **OAuth / MCP connector config exposure** — connector tokens and headers recorded during `snapshot` must stay redacted in the repo and only live in the gitignored `secrets.local.json`; any path that writes them elsewhere unredacted is in scope.
- **Non-destructive `restore` guarantee** — `restore` is documented to always copy the current `~/.claude` to `~/.claude.pre-restore-<timestamp>` before overwriting anything. A bug that skips or corrupts this backup step is in scope.
