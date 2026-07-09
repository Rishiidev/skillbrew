# Contributing to skillbrew

Thanks for looking at skillbrew. It's a small CLI that backs up, restores, syncs, and bundles a Claude Code setup — skills, plugins, agents, MCP connectors, config — and it touches real `~/.claude` state, so correctness and non-destructiveness matter more than speed here. PRs that add a command, fix an edge case in `snapshot`/`restore`, or improve redaction coverage are all welcome.

## Running tests

```bash
node --test test/skillbrew.test.js
```

## Testing against a fake home

Never point `snapshot` or `restore` at your real `~/.claude` while developing. Use the env overrides `claude-paths.js` reads:

```bash
export SKILLBREW_CLAUDE_HOME=/tmp/fake-claude
export SKILLBREW_CLAUDE_JSON=/tmp/fake-claude.json
export SKILLBREW_CONFIG=/tmp/fake-skillbrew.json
export SKILLBREW_REPO=/tmp/fake-backup-repo
```

With these set, `claude` CLI calls (plugin reinstall, etc.) are skipped, so you can safely run `init`, `snapshot`, `restore`, `pack`, `install`, and `export` end-to-end against throwaway directories.

## Pull requests

- One command/module per PR where possible — keep diffs reviewable.
- Include a before/after (paste real CLI output) for behavior changes.
- If you touch `src/secrets.js`, add a test proving values still redact/re-merge correctly.
- If you touch `src/restore.js`, confirm the pre-restore backup (`~/.claude.pre-restore-<ts>`) still gets written before anything is overwritten.
- Update `README.md` if you add or change a command's flags or output.

## Bug reports

Use the bug report template. Include the exact command you ran, the `SKILLBREW_*` env vars in effect (not their values if secret), and the actual vs. expected output. If it's a `restore` or `install` issue, mention whether you were testing against a fake home.

## Security issues

Do not open a public issue. See `SECURITY.md`.
