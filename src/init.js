import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { saveBunchConfig, loadBunchConfig } from './claude-paths.js';
import { emptyManifest, saveManifest, loadManifest, manifestPath } from './manifest.js';
import { run, mkdirp, exists } from './fsutil.js';

const GITIGNORE = `exports/
secrets.local.json
.DS_Store
`;

const README = `# Claude setup backup (made with bunch)

This repo holds a full snapshot of a Claude Code environment: skills, agents,
plugin list, connector list, and config.

## Restore on a fresh machine

Paste this into a fresh Claude Code session:

> Clone https://github.com/REPLACE_ME/bunch and this backup repo, then run
> \`node bunch/bin/bunch.js restore\` with BUNCH_REPO pointing at the backup
> repo clone. Follow the re-auth checklist it prints.

Or by hand:

\`\`\`bash
git clone <this-repo> ~/bunch-backup
git clone https://github.com/REPLACE_ME/bunch ~/bunch
BUNCH_REPO=~/bunch-backup node ~/bunch/bin/bunch.js restore
\`\`\`

Secrets are never stored here — values are redacted; restore prints what needs
re-keying and which connectors need OAuth re-auth.
`;

export function init(dirArg, { github = false } = {}) {
  const dir = path.resolve(dirArg || path.join(os.homedir(), 'bunch-backup'));
  mkdirp(dir);

  if (!exists(path.join(dir, '.git'))) {
    const r = run('git', ['init'], { cwd: dir });
    if (!r.ok) throw new Error(`git init failed: ${r.stderr}`);
  }
  fs.writeFileSync(path.join(dir, '.gitignore'), GITIGNORE);
  if (!exists(path.join(dir, 'README.md'))) {
    fs.writeFileSync(path.join(dir, 'README.md'), README);
  }
  if (!exists(manifestPath(dir))) {
    saveManifest(dir, emptyManifest());
  } else {
    // keep existing manifest (re-init is safe)
    saveManifest(dir, loadManifest(dir));
  }

  const cfg = loadBunchConfig();
  cfg.repoDir = dir;
  saveBunchConfig(cfg);

  let remote = null;
  if (github) {
    const name = path.basename(dir);
    const r = run('gh', ['repo', 'create', name, '--private', '--source', dir, '--push'], { cwd: dir });
    if (r.ok) remote = r.stdout;
    else console.error(`gh repo create failed (continuing local-only): ${r.stderr || r.error?.message}`);
  }

  console.log(`bunch: backup repo ready at ${dir}${remote ? ` (remote: ${remote})` : ' (local only — add a private GitHub remote for sync)'}`);
  return dir;
}
