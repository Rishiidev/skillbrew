import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { claudeHome } from './claude-paths.js';
import { copyDir, exists, rmrf, run, readJson } from './fsutil.js';

// The marketplace primitive: install skills from any rishiidev-format repo.
// spec: github:user/repo | full git URL | local path
export function install(spec, { pack = null, force = false } = {}) {
  if (!spec) throw new Error('usage: rishiidev install <github:user/repo | url | path> [--pack <name>] [--force]');
  let src = spec;
  const m = spec.match(/^github:([^/]+)\/(.+)$/);
  if (m) src = `https://github.com/${m[1]}/${m[2]}.git`;

  let dir = src;
  let tmp = null;
  if (!exists(src)) {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rishiidev-install-'));
    const r = run('git', ['clone', '--depth', '1', src, tmp]);
    if (!r.ok) throw new Error(`clone failed: ${r.stderr}`);
    dir = tmp;
  }

  try {
    const skillsDir = path.join(dir, 'skills');
    if (!exists(skillsDir)) throw new Error(`No skills/ directory in ${spec} — not a rishiidev-format repo`);

    let names = fs.readdirSync(skillsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
    if (pack) {
      const manifest = readJson(path.join(dir, 'manifest.json'), {});
      const p = manifest.packs?.[pack];
      if (!p) throw new Error(`Pack "${pack}" not found in ${spec}`);
      names = p;
    }

    const home = claudeHome();
    let installed = 0;
    for (const name of names) {
      const dest = path.join(home, 'skills', name);
      if (exists(dest) && !force) {
        console.log(`  skip ${name}: already installed (use --force to overwrite)`);
        continue;
      }
      copyDir(path.join(skillsDir, name), dest);
      installed++;
      console.log(`  + ${name}`);
    }
    console.log(`rishiidev: installed ${installed} skills from ${spec} — restart Claude Code to load them`);
  } finally {
    if (tmp) rmrf(tmp);
  }
}
