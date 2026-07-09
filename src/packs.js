import { repoDir } from './claude-paths.js';
import { loadManifest, saveManifest } from './manifest.js';
import { restore } from './restore.js';

export function packCreate(name, skills) {
  if (!name || !skills.length) throw new Error('usage: rishiidev pack create <name> <skill...>');
  const repo = repoDir();
  const manifest = loadManifest(repo);
  const known = new Set(manifest.items.filter((i) => i.type === 'skill').map((i) => i.name));
  const missing = skills.filter((s) => !known.has(s));
  if (missing.length) {
    throw new Error(`Not in last snapshot: ${missing.join(', ')}. Run rishiidev snapshot first or check names with rishiidev list.`);
  }
  manifest.packs = manifest.packs || {};
  manifest.packs[name] = skills;
  saveManifest(repo, manifest);
  console.log(`rishiidev: pack "${name}" = ${skills.join(', ')}`);
}

export function packList() {
  const manifest = loadManifest(repoDir());
  const packs = Object.entries(manifest.packs || {});
  if (!packs.length) return console.log('rishiidev: no packs yet — rishiidev pack create <name> <skill...>');
  for (const [name, skills] of packs) {
    console.log(`${name}  (${skills.length}): ${skills.join(', ')}`);
  }
}

export function packInstall(name) {
  if (!name) throw new Error('usage: rishiidev pack install <name>');
  restore({ pack: name });
}
