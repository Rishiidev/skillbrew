import { repoDir } from './claude-paths.js';
import { loadManifest } from './manifest.js';

const BADGE = {
  auto: '✅',
  'zip-upload': '🟡 zip',
  'convert-lossy': '🟡 convert',
  'paste-text': '🟡 paste',
  'remote-connector': '✅ remote',
  mcp: '✅ mcp',
  'mcp-partial': '🟡 partial',
};

const COLS = ['claude-code', 'claude-ai', 'gemini-cli', 'chatgpt'];

export function list() {
  const manifest = loadManifest(repoDir());
  if (!manifest.lastSnapshot) return console.log('skillbrew: no snapshot yet — run skillbrew snapshot');

  console.log(`Last snapshot: ${manifest.lastSnapshot} on ${manifest.machine}\n`);
  const header = ['TYPE', 'NAME', ...COLS.map((c) => c.toUpperCase())];
  const rows = [header];
  for (const type of ['skill', 'plugin', 'connector']) {
    for (const item of manifest.items.filter((i) => i.type === type)) {
      rows.push([
        type,
        item.name + (item.source ? `  (${item.source})` : ''),
        ...COLS.map((c) => BADGE[item.platforms?.[c]] || '—'),
      ]);
    }
  }
  const widths = header.map((_, i) => Math.max(...rows.map((r) => String(r[i]).length)));
  for (const r of rows) {
    console.log(r.map((cell, i) => String(cell).padEnd(widths[i] + 2)).join(''));
  }

  const packs = Object.entries(manifest.packs || {});
  if (packs.length) {
    console.log('\nPacks:');
    for (const [name, skills] of packs) console.log(`  ${name}: ${skills.join(', ')}`);
  }
}
