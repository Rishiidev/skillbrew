import fs from 'node:fs';
import path from 'node:path';

export const MANIFEST_VERSION = 1;

// Platform fidelity per item type. Honest tiers: "auto" is a real install,
// everything else is assisted-manual and must never be marketed as install.
const PLATFORM_MATRIX = {
  skill: {
    'claude-code': 'auto',
    'claude-desktop': 'auto',
    'claude-ai': 'zip-upload',
    'gemini-cli': 'convert-lossy',
    cursor: 'convert-lossy',
    chatgpt: 'paste-text',
  },
  plugin: {
    'claude-code': 'auto',
    'claude-desktop': 'auto',
  },
  connector: {
    'claude-code': 'auto',
    'claude-desktop': 'auto',
    'claude-ai': 'remote-connector',
    'gemini-cli': 'mcp',
    cursor: 'mcp',
    chatgpt: 'mcp-partial',
  },
};

export function platformsFor(type) {
  return PLATFORM_MATRIX[type] || {};
}

export function emptyManifest() {
  return {
    manifestVersion: MANIFEST_VERSION,
    tool: 'rishiidev',
    createdAt: new Date().toISOString(),
    lastSnapshot: null,
    machine: null,
    items: [],
    plugins: [],
    marketplaces: {},
    connectors: [],
    packs: {},
  };
}

export function manifestPath(repo) {
  return path.join(repo, 'manifest.json');
}

export function loadManifest(repo) {
  try {
    return JSON.parse(fs.readFileSync(manifestPath(repo), 'utf8'));
  } catch {
    return emptyManifest();
  }
}

export function saveManifest(repo, manifest) {
  fs.writeFileSync(manifestPath(repo), JSON.stringify(manifest, null, 2) + '\n');
}
