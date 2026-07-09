import fs from 'node:fs';
import path from 'node:path';

export const MANIFEST_VERSION = 1;

/**
 * @typedef {string[]} Pack
 */

/**
 * @typedef {Object} ManifestItem
 * @property {string} name
 * @property {'skill' | 'plugin' | 'connector'} type
 * @property {string | null} source
 * @property {Record<string, string>} platforms
 * @property {boolean} [linked]
 * @property {boolean} [hasNodeModules]
 */

/**
 * @typedef {Object} Manifest
 * @property {number} manifestVersion
 * @property {string} tool
 * @property {string} createdAt
 * @property {string | null} lastSnapshot
 * @property {string | null} machine
 * @property {ManifestItem[]} items
 * @property {{name: string, marketplace: string, version: string | null}[]} plugins
 * @property {Record<string, string | null>} marketplaces
 * @property {{name: string, transport: string, needsAuth: boolean}[]} connectors
 * @property {Record<string, Pack>} packs
 */

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

/**
 * Create a new empty skillbrew manifest.
 * @returns {Manifest}
 */
export function emptyManifest() {
  return {
    manifestVersion: MANIFEST_VERSION,
    tool: 'skillbrew',
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

/**
 * Load a manifest from a repository, or return a new manifest if none exists.
 * @param {string} repo
 * @returns {Manifest}
 */
export function loadManifest(repo) {
  try {
    return JSON.parse(fs.readFileSync(manifestPath(repo), 'utf8'));
  } catch {
    return emptyManifest();
  }
}

/**
 * Save a manifest to a repository.
 * @param {string} repo
 * @param {Manifest} manifest
 * @returns {void}
 */
export function saveManifest(repo, manifest) {
  fs.writeFileSync(manifestPath(repo), JSON.stringify(manifest, null, 2) + '\n');
}
