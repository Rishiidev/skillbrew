import path from 'node:path';
import fs from 'node:fs';
import { repoDir } from './claude-paths.js';
import { loadManifest } from './manifest.js';
import { run, mkdirp, exists } from './fsutil.js';

// claude.ai capability upload wants SKILL.md at the zip root,
// so each zip is built from inside the skill folder.
export function exportChat({ pack = null } = {}) {
  const repo = repoDir();
  const manifest = loadManifest(repo);
  let names = manifest.items.filter((i) => i.type === 'skill').map((i) => i.name);
  if (pack) {
    const p = manifest.packs?.[pack];
    if (!p) throw new Error(`Unknown pack "${pack}"`);
    names = p;
  }
  const outDir = path.join(repo, 'exports');
  mkdirp(outDir);
  let made = 0;
  for (const name of names) {
    const dir = path.join(repo, 'skills', name);
    if (!exists(path.join(dir, 'SKILL.md'))) {
      console.log(`  skip ${name}: no SKILL.md (claude.ai upload needs it at zip root)`);
      continue;
    }
    const out = path.join(outDir, `${name}.zip`);
    fs.rmSync(out, { force: true });
    const r = run('zip', ['-r', '-q', out, '.', '-x', '.*'], { cwd: dir });
    if (r.ok) made++;
    else console.log(`  ${name}: zip failed — ${r.stderr}`);
  }
  console.log(`skillbrew: ${made} zips in ${outDir} — upload each at claude.ai → Settings → Capabilities → Skills`);
}
