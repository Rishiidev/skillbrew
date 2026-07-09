import fs from 'node:fs';
import path from 'node:path';
import { claudeHome, claudeJsonPath, repoDir } from './claude-paths.js';
import { loadManifest } from './manifest.js';
import { copyDir, exists, mkdirp, run, gitRemote, readJson, writeJson } from './fsutil.js';
import { mergeSecrets } from './secrets.js';

const CONFIG_FILES = ['CLAUDE.md', 'keybindings.json'];

export function restore({ pack = null, skillsOnly = false } = {}) {
  const repo = repoDir();
  const home = claudeHome();

  // pull latest if remote configured (best effort)
  if (gitRemote(repo)) run('git', ['pull', '--ff-only'], { cwd: repo });

  const manifest = loadManifest(repo);
  const secrets = readJson(path.join(repo, 'secrets.local.json'), {});

  // never destructive: timestamped copy of current state first
  if (exists(home)) {
    const backup = `${home}.pre-restore-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    copyDir(home, backup, { skipNodeModules: false });
    console.log(`bunch: existing setup copied to ${backup}`);
  }
  mkdirp(home);

  // --- skills (all, or a pack subset) ---
  let skillNames = manifest.items.filter((i) => i.type === 'skill').map((i) => i.name);
  if (pack) {
    const packSkills = manifest.packs?.[pack];
    if (!packSkills) throw new Error(`Unknown pack "${pack}". Known: ${Object.keys(manifest.packs || {}).join(', ') || '(none)'}`);
    skillNames = packSkills;
  }
  let restored = 0;
  const npmNote = [];
  for (const name of skillNames) {
    const src = path.join(repo, 'skills', name);
    if (!exists(src)) {
      console.log(`  skip ${name}: not in backup`);
      continue;
    }
    copyDir(src, path.join(home, 'skills', name));
    restored++;
    const item = manifest.items.find((i) => i.type === 'skill' && i.name === name);
    if (item?.hasNodeModules) npmNote.push(name);
  }
  console.log(`bunch: restored ${restored} skills${pack ? ` (pack: ${pack})` : ''}`);

  if (pack || skillsOnly) return finishReport({ npmNote, manifest, redacted: [] });

  // --- agents + config ---
  const agentsSrc = path.join(repo, 'agents');
  if (exists(agentsSrc)) copyDir(agentsSrc, path.join(home, 'agents'));
  for (const f of CONFIG_FILES) {
    const src = path.join(repo, 'config', f);
    if (exists(src)) fs.copyFileSync(src, path.join(home, f));
  }

  // settings.json: sanitized repo copy + local secrets merged back
  const settingsSrc = path.join(repo, 'config', 'settings.json');
  const mcpRepo = readJson(path.join(repo, 'config', 'mcp-servers.json'), {});
  let redactReport = { unresolved: [], stillRedacted: [] };
  if (exists(settingsSrc)) {
    const settings = readJson(settingsSrc, {});
    redactReport = mergeSecrets({ settings, mcpServers: mcpRepo }, secrets);
    writeJson(path.join(home, 'settings.json'), settings);
  } else {
    redactReport = mergeSecrets({ settings: null, mcpServers: mcpRepo }, secrets);
  }

  // --- connectors: merge mcpServers back into ~/.claude.json ---
  const cjPath = claudeJsonPath();
  if (Object.keys(mcpRepo).length) {
    const cj = readJson(cjPath, {});
    cj.mcpServers = { ...(cj.mcpServers || {}), ...mcpRepo };
    writeJson(cjPath, cj);
    console.log(`bunch: merged ${Object.keys(mcpRepo).length} connectors into ${cjPath}`);
  }

  // --- plugins: reinstall from source via claude CLI ---
  // claude CLI always operates on the real ~/.claude; when a test/home
  // override is active it must not run, only print the commands.
  const haveClaude = !process.env.BUNCH_CLAUDE_HOME && run('claude', ['--version']).ok;
  const cmds = [];
  for (const [name, url] of Object.entries(manifest.marketplaces || {})) {
    if (url) cmds.push(['plugin', 'marketplace', 'add', url]);
    else console.log(`  marketplace ${name}: no source recorded, re-add manually`);
  }
  for (const p of manifest.plugins || []) {
    cmds.push(['plugin', 'install', `${p.name}@${p.marketplace}`]);
  }
  if (haveClaude) {
    for (const args of cmds) {
      const r = run('claude', args);
      console.log(`  claude ${args.join(' ')} ${r.ok ? 'ok' : `FAILED: ${(r.stderr || r.stdout).split('\n')[0]}`}`);
    }
  } else if (cmds.length) {
    console.log('bunch: claude CLI not found — run these after installing Claude Code:');
    for (const args of cmds) console.log(`  claude ${args.join(' ')}`);
  }

  return finishReport({ npmNote, manifest, redacted: redactReport.stillRedacted });
}

function finishReport({ npmNote, manifest, redacted }) {
  if (npmNote.length) {
    console.log(`bunch: these skills had node_modules (not backed up) — run npm install inside each: ${npmNote.join(', ')}`);
  }
  const needAuth = (manifest.connectors || []).filter((c) => c.needsAuth).map((c) => c.name);
  if (needAuth.length) {
    console.log(`bunch: re-auth checklist (OAuth/keys cannot be copied): ${needAuth.join(', ')}`);
  }
  if (redacted.length) {
    console.log(`bunch: still-redacted values needing manual re-key (no secrets.local.json found for them):`);
    for (const r of redacted) console.log(`  ${r}`);
  }
  console.log('bunch: restore complete — restart Claude Code to load everything');
}
