## What this changes

<!-- Which command/module changed? Be specific (e.g. src/restore.js, `skillbrew snapshot`). -->

## Why

## Before / after

Before:
(paste old behavior or output)

After:
(paste improved behavior or output)

## Checklist

- [ ] `node --test test/skillbrew.test.js` passes
- [ ] Tested against a fake `SKILLBREW_CLAUDE_HOME` (and `SKILLBREW_CLAUDE_JSON`/`SKILLBREW_REPO`/`SKILLBREW_CONFIG` as needed) — not real `~/.claude`
- [ ] No secrets (tokens, keys, real `secrets.local.json` values) committed
- [ ] Redaction (`src/secrets.js`) still redacts and re-merges correctly if touched
- [ ] `restore` still writes the `~/.claude.pre-restore-<timestamp>` backup before overwriting anything, if touched
- [ ] `README.md` updated if commands, flags, or output changed
