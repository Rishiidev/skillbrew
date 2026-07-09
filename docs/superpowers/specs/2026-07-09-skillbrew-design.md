# skillbrew — design spec (2026-07-09)

Full strategy + phased roadmap: see approved plan (`~/.claude/plans/pure-crunching-pike.md`), mirrored here in short form.

**Problem**: Claude Code reset/machine switch wipes `~/.claude` — skills, plugins, agents, config all rebuilt by hand.

**Positioning**: environment portability, not skill discovery. Personal manager first; marketplace only as later outcome. No invented universal format — native Claude format is source of truth, export adapters later (AGENTS.md/GEMINI.md), never `skill.yaml`.

**Phase 1 (this build)**: Node CLI, zero deps.
- `init` / `snapshot` / `restore [--pack]` / `pack create|list|install` / `export --chat` / `install <repo>` / `list`
- Manifest tracks items with `type` (skill/plugin/connector), `source` (github:user/repo from git remote), platform badge matrix.
- Plugins recorded as name@marketplace + source URL, reinstalled via `claude plugin` CLI, never cache-copied.
- Connectors = `mcpServers` from `~/.claude.json`, sanitized.
- Secrets redacted in repo, real values in gitignored `secrets.local.json`; restore merges back or prints re-key checklist.
- Restore never destructive: `~/.claude.pre-restore-<ts>` copy first.
- Bootstrap on fresh machine: backup repo README paste-prompt — the agent is the installer.

**Phases 1.5–4 + kill criteria**: picker site (shadcn model) → export adapters → team bundles (commercial wedge) → marketplace. Each gated on real usage of the previous phase.

**Verification**: unit tests (`node --test test/`) + e2e against `SKILLBREW_CLAUDE_HOME` fake home (snapshot→wipe→restore round-trip, packs, zips, install). `claude` CLI calls auto-skipped when home override active.
