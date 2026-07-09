import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

export function claudeHome() {
  return process.env.RISHIIDEV_CLAUDE_HOME || path.join(os.homedir(), '.claude');
}

// User-scope MCP servers live in ~/.claude.json, not ~/.claude/
export function claudeJsonPath() {
  return process.env.RISHIIDEV_CLAUDE_JSON || path.join(os.homedir(), '.claude.json');
}

export function rishiidevConfigPath() {
  return process.env.RISHIIDEV_CONFIG || path.join(os.homedir(), '.rishiidev.json');
}

export function loadRishiidevConfig() {
  try {
    return JSON.parse(fs.readFileSync(rishiidevConfigPath(), 'utf8'));
  } catch {
    return {};
  }
}

export function saveRishiidevConfig(cfg) {
  fs.writeFileSync(rishiidevConfigPath(), JSON.stringify(cfg, null, 2) + '\n');
}

export function repoDir() {
  const dir = process.env.RISHIIDEV_REPO || loadRishiidevConfig().repoDir;
  if (!dir) {
    throw new Error('No backup repo configured. Run: rishiidev init [dir]');
  }
  return dir;
}
