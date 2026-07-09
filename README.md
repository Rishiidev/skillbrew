# rishiidev

Backup, restore, sync and bundle your Claude Code setup — skills, plugins, agents, MCP connectors, config. One command to save it all to a GitHub repo, one command to rebuild it on any machine.

```bash
rishiidev init --github     # create private backup repo
rishiidev snapshot          # save everything, commit, push
# ...machine reset happens...
rishiidev restore           # rebuild ~/.claude, reinstall plugins, print re-auth checklist
```

## Fresh machine (nothing installed yet)

Paste into a fresh Claude Code session:

> Clone https://github.com/Rishiidev/rishiidev and my backup repo https://github.com/Rishiidev/rishiidev-backup, then run `RISHIIDEV_REPO=<backup-clone> node rishiidev/bin/rishiidev.js restore` and walk me through the re-auth checklist.

The agent is the installer.

## Commands

| Command | Does |
|---|---|
| `rishiidev init [dir] [--github]` | Create backup repo (default `~/rishiidev-backup`), `--github` adds private remote via `gh` |
| `rishiidev snapshot` | Copy skills/agents/config, record plugins + marketplaces + MCP connectors, commit + push |
| `rishiidev restore [--pack <name>]` | Rebuild `~/.claude`. Current state copied to `~/.claude.pre-restore-<ts>` first — never destructive |
| `rishiidev pack create <name> <skill...>` | Named skill collection |
| `rishiidev pack list` / `pack install <name>` | Show / install a collection |
| `rishiidev export --chat [--pack p]` | Per-skill zips for claude.ai → Settings → Capabilities upload |
| `rishiidev install <github:user/repo\|url\|path> [--pack p] [--force]` | Install skills from any rishiidev-format repo |
| `rishiidev list` | Everything tracked, with platform badges |

## What travels where (honest tiers)

| Item | Claude Code/Desktop | claude.ai | Gemini CLI/Cursor | ChatGPT |
|---|---|---|---|---|
| Skill | ✅ auto | 🟡 zip upload | 🟡 lossy convert (v2) | 🟡 paste text |
| Plugin | ✅ auto (reinstalled from marketplace source) | — | — | — |
| Connector (MCP) | ✅ | ✅ remote | ✅ MCP standard | 🟡 partial |

## Security

- Secrets (env values, MCP tokens/headers) are **redacted** in the repo and kept in `secrets.local.json` (gitignored). Restore merges them back if the file exists, otherwise prints exactly what needs re-keying.
- OAuth sessions can't be copied — restore prints a re-auth checklist.
- Backup repo is created **private** by default.

## Design notes

- Plugins are recorded as `name@marketplace` + source URL and reinstalled via `claude plugin` — never cache-copied, so versions stay clean.
- Nested `.git` dirs are stripped from skill copies; the origin remote is recorded as `source` (so a picker/marketplace can link back to the original repo).
- `node_modules` never backed up; restore prints an `npm install` note per affected skill.
- Env overrides `RISHIIDEV_CLAUDE_HOME` / `RISHIIDEV_CLAUDE_JSON` / `RISHIIDEV_REPO` / `RISHIIDEV_CONFIG` let tests run against a fake home; `claude` CLI calls are skipped in that mode.

MIT
