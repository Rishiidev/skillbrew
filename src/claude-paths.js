import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

export function claudeHome() {
  return process.env.SKILLBREW_CLAUDE_HOME || path.join(os.homedir(), '.claude');
}

// User-scope MCP servers live in ~/.claude.json, not ~/.claude/
export function claudeJsonPath() {
  return process.env.SKILLBREW_CLAUDE_JSON || path.join(os.homedir(), '.claude.json');
}

export function skillbrewConfigPath() {
  return process.env.SKILLBREW_CONFIG || path.join(os.homedir(), '.skillbrew.json');
}

export function loadSkillbrewConfig() {
  try {
    return JSON.parse(fs.readFileSync(skillbrewConfigPath(), 'utf8'));
  } catch {
    return {};
  }
}

export function saveSkillbrewConfig(cfg) {
  fs.writeFileSync(skillbrewConfigPath(), JSON.stringify(cfg, null, 2) + '\n');
}

export function repoDir() {
  const dir = process.env.SKILLBREW_REPO || loadSkillbrewConfig().repoDir;
  if (!dir) {
    throw new Error('No backup repo configured. Run: skillbrew init [dir]');
  }
  return dir;
}
