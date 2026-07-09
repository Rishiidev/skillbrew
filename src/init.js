import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { saveSkillbrewConfig, loadSkillbrewConfig } from './claude-paths.js';
import { emptyManifest, saveManifest, loadManifest, manifestPath } from './manifest.js';
import { run, mkdirp, exists } from './fsutil.js';

const GITIGNORE = `exports/
secrets.local.json
.DS_Store
`;

const README = `# Claude setup backup (made with skillbrew)

This repo holds a full snapshot of a Claude Code environment: skills, agents,
plugin list, connector list, and config.

## Restore on a fresh machine

Paste this into a fresh Claude Code session:

> Clone https://github.com/Rishiidev/skillbrew and this backup repo, then run
> \`node skillbrew/bin/skillbrew.js restore\` with SKILLBREW_REPO pointing at the backup
> repo clone. Follow the re-auth checklist it prints.

Or by hand:

\`\`\`bash
git clone <this-repo> ~/skillbrew-backup
git clone https://github.com/Rishiidev/skillbrew ~/skillbrew
SKILLBREW_REPO=~/skillbrew-backup node ~/skillbrew/bin/skillbrew.js restore
\`\`\`

Secrets are never stored here — values are redacted; restore prints what needs
re-keying and which connectors need OAuth re-auth.
`;

export function init(dirArg, { github = false } = {}) {
  const dir = path.resolve(dirArg || path.join(os.homedir(), 'skillbrew-backup'));
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

  const cfg = loadSkillbrewConfig();
  cfg.repoDir = dir;
  saveSkillbrewConfig(cfg);

  // gh repo create --push needs at least one commit
  run('git', ['add', '-A'], { cwd: dir });
  run('git', ['commit', '-m', 'skillbrew init'], { cwd: dir });

  let remote = null;
  if (github) {
    const name = path.basename(dir);
    const r = run('gh', ['repo', 'create', name, '--private', '--source', dir, '--push'], { cwd: dir });
    if (r.ok) remote = r.stdout;
    else console.error(`gh repo create failed (continuing local-only): ${r.stderr || r.error?.message}`);
  }

  console.log(`skillbrew: backup repo ready at ${dir}${remote ? ` (remote: ${remote})` : ' (local only — add a private GitHub remote for sync)'}`);
  return dir;
}
