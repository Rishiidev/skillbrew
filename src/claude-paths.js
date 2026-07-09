import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

export function claudeHome() {
  return process.env.BUNCH_CLAUDE_HOME || path.join(os.homedir(), '.claude');
}

// User-scope MCP servers live in ~/.claude.json, not ~/.claude/
export function claudeJsonPath() {
  return process.env.BUNCH_CLAUDE_JSON || path.join(os.homedir(), '.claude.json');
}

export function bunchConfigPath() {
  return process.env.BUNCH_CONFIG || path.join(os.homedir(), '.bunch.json');
}

export function loadBunchConfig() {
  try {
    return JSON.parse(fs.readFileSync(bunchConfigPath(), 'utf8'));
  } catch {
    return {};
  }
}

export function saveBunchConfig(cfg) {
  fs.writeFileSync(bunchConfigPath(), JSON.stringify(cfg, null, 2) + '\n');
}

export function repoDir() {
  const dir = process.env.BUNCH_REPO || loadBunchConfig().repoDir;
  if (!dir) {
    throw new Error('No backup repo configured. Run: bunch init [dir]');
  }
  return dir;
}
