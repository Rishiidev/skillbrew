import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const SKIP_ALWAYS = new Set(['.git', '.DS_Store']);

export function exists(p) {
  return fs.existsSync(p);
}

export function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

export function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}

// Recursive copy. Skips .git (nested repos would corrupt the backup repo)
// and node_modules (restore prints an "npm install" note instead).
// Returns { hasNodeModules }.
export function copyDir(src, dest, opts = {}) {
  const skipNodeModules = opts.skipNodeModules !== false;
  let hasNodeModules = false;
  mkdirp(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (SKIP_ALWAYS.has(entry.name)) continue;
    if (skipNodeModules && entry.name === 'node_modules') {
      hasNodeModules = true;
      continue;
    }
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isSymbolicLink()) {
      // preserve symlinks as-is (some skills symlink into plugin cache)
      const target = fs.readlinkSync(from);
      try { fs.symlinkSync(target, to); } catch { /* exists */ }
    } else if (entry.isDirectory()) {
      const sub = copyDir(from, to, opts);
      hasNodeModules = hasNodeModules || sub.hasNodeModules;
    } else {
      fs.copyFileSync(from, to);
    }
  }
  return { hasNodeModules };
}

export function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  return {
    ok: res.status === 0,
    stdout: (res.stdout || '').trim(),
    stderr: (res.stderr || '').trim(),
    status: res.status,
    error: res.error,
  };
}

export function gitRemote(dir) {
  const res = run('git', ['-C', dir, 'remote', 'get-url', 'origin']);
  return res.ok ? res.stdout : null;
}

// https://github.com/user/repo.git -> github:user/repo
export function shortSource(url) {
  if (!url) return null;
  const m = url.match(/github\.com[:/]([^/]+)\/([^/]+?)(\.git)?$/);
  return m ? `github:${m[1]}/${m[2]}` : url;
}

export function readJson(p, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}

export function writeJson(p, obj) {
  mkdirp(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}
