import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { claudeHome, claudeJsonPath, repoDir } from './claude-paths.js';
import { loadManifest, saveManifest, platformsFor } from './manifest.js';
import { copyDir, exists, rmrf, mkdirp, run, gitRemote, shortSource, readJson, writeJson } from './fsutil.js';
import { sanitizeSettings, sanitizeMcpServers } from './secrets.js';

const CONFIG_FILES = ['CLAUDE.md', 'settings.json', 'keybindings.json'];

export function snapshot() {
  const repo = repoDir();
  const home = claudeHome();
  if (!exists(home)) throw new Error(`Claude home not found: ${home}`);

  const manifest = loadManifest(repo);
  const items = [];
  const allSecrets = {};

  // --- skills ---
  const skillsSrc = path.join(home, 'skills');
  const skillsDest = path.join(repo, 'skills');
  rmrf(skillsDest);
  if (exists(skillsSrc)) {
    for (const entry of fs.readdirSync(skillsSrc, { withFileTypes: true })) {
      // Symlinked skills (e.g. into another tool's scratch dir) are the first
      // casualties of a reset — dereference and back up the real content.
      let src = path.join(skillsSrc, entry.name);
      let linked = false;
      if (entry.isSymbolicLink()) {
        try {
          src = fs.realpathSync(src);
          if (!fs.statSync(src).isDirectory()) continue;
          linked = true;
        } catch {
          console.log(`  skip ${entry.name}: broken symlink`);
          continue;
        }
      } else if (!entry.isDirectory()) continue;
      const { hasNodeModules } = copyDir(src, path.join(skillsDest, entry.name));
      items.push({
        name: entry.name,
        type: 'skill',
        source: shortSource(gitRemote(src)),
        linked,
        hasNodeModules,
        platforms: platformsFor('skill'),
      });
    }
  }

  // --- agents ---
  const agentsSrc = path.join(home, 'agents');
  const agentsDest = path.join(repo, 'agents');
  rmrf(agentsDest);
  if (exists(agentsSrc)) copyDir(agentsSrc, agentsDest);

  // --- config files (settings sanitized) ---
  const configDest = path.join(repo, 'config');
  rmrf(configDest);
  mkdirp(configDest);
  for (const f of CONFIG_FILES) {
    const src = path.join(home, f);
    if (!exists(src)) continue;
    if (f === 'settings.json') {
      const settings = readJson(src, {});
      const { clean, secrets } = sanitizeSettings(settings);
      writeJson(path.join(configDest, f), clean);
      Object.assign(allSecrets, secrets);
    } else {
      fs.copyFileSync(src, path.join(configDest, f));
    }
  }

  // --- plugins (recorded, never cache-copied) ---
  const installed = readJson(path.join(home, 'plugins', 'installed_plugins.json'), { plugins: {} });
  const plugins = [];
  for (const [key, entries] of Object.entries(installed.plugins || {})) {
    const [name, marketplace] = key.split('@');
    const entry = Array.isArray(entries) ? entries[0] : entries;
    plugins.push({ name, marketplace, version: entry?.version || null });
    items.push({ name: key, type: 'plugin', source: null, platforms: platformsFor('plugin') });
  }
  const known = readJson(path.join(home, 'plugins', 'known_marketplaces.json'), {});
  const marketplaces = {};
  for (const [name, m] of Object.entries(known)) {
    marketplaces[name] = m?.source?.url || m?.source?.repo || null;
  }
  for (const p of items) {
    if (p.type === 'plugin') {
      const mk = p.name.split('@')[1];
      p.source = shortSource(marketplaces[mk]) || null;
    }
  }

  // --- connectors (MCP servers from ~/.claude.json, sanitized) ---
  const claudeJson = readJson(claudeJsonPath(), {});
  const { clean: mcpClean, secrets: mcpSecrets } = sanitizeMcpServers(claudeJson.mcpServers || {});
  writeJson(path.join(configDest, 'mcp-servers.json'), mcpClean);
  Object.assign(allSecrets, mcpSecrets);
  const connectors = Object.entries(mcpClean).map(([name, cfg]) => ({
    name,
    transport: cfg.type || (cfg.url ? 'http' : 'stdio'),
    needsAuth: Boolean(cfg.env || cfg.headers),
  }));
  for (const c of connectors) {
    items.push({ name: c.name, type: 'connector', source: null, platforms: platformsFor('connector') });
  }

  // --- local secrets (gitignored) ---
  writeJson(path.join(repo, 'secrets.local.json'), allSecrets);

  // --- manifest ---
  manifest.machine = os.hostname();
  manifest.lastSnapshot = new Date().toISOString();
  manifest.items = items;
  manifest.plugins = plugins;
  manifest.marketplaces = marketplaces;
  manifest.connectors = connectors;
  saveManifest(repo, manifest);

  // --- commit + push ---
  run('git', ['add', '-A'], { cwd: repo });
  const commit = run('git', ['commit', '-m', `snapshot ${manifest.lastSnapshot} (${os.hostname()})`], { cwd: repo });
  let pushed = false;
  if (gitRemote(repo)) {
    pushed = run('git', ['push', '-u', 'origin', 'HEAD'], { cwd: repo }).ok;
  }

  const skillCount = items.filter((i) => i.type === 'skill').length;
  console.log(`bunch: snapshot done — ${skillCount} skills, ${plugins.length} plugins, ${connectors.length} connectors`);
  console.log(`  repo: ${repo}${pushed ? ' (pushed)' : gitRemote(repo) ? ' (push FAILED — check remote)' : ' (local only)'}`);
  if (!commit.ok && !/nothing to commit/.test(commit.stdout + commit.stderr)) {
    console.log(`  commit: ${commit.stderr || commit.stdout}`);
  }
  if (Object.keys(allSecrets).length) {
    console.log(`  secrets: ${Object.keys(allSecrets).length} values redacted in repo, kept in secrets.local.json (gitignored)`);
  }
  return manifest;
}
