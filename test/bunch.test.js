import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSettings, sanitizeMcpServers, mergeSecrets, REDACTED } from '../src/secrets.js';
import { platformsFor } from '../src/manifest.js';
import { shortSource } from '../src/fsutil.js';

test('sanitizeSettings redacts env values and secret-named keys', () => {
  const { clean, secrets } = sanitizeSettings({
    model: 'opus',
    env: { GITHUB_TOKEN: 'ghp_abc', PLAIN: 'x' },
    apiKeyHelper: 'echo sk-123',
  });
  assert.equal(clean.env.GITHUB_TOKEN, REDACTED);
  assert.equal(clean.env.PLAIN, REDACTED); // all env values treated as sensitive
  assert.equal(clean.apiKeyHelper, REDACTED);
  assert.equal(clean.model, 'opus');
  assert.equal(secrets['settings.env.GITHUB_TOKEN'], 'ghp_abc');
});

test('sanitizeMcpServers redacts env and headers, keeps structure', () => {
  const { clean, secrets } = sanitizeMcpServers({
    github: { command: 'npx', env: { TOKEN: 't1' } },
    remote: { url: 'https://x', headers: { Authorization: 'Bearer y' } },
  });
  assert.equal(clean.github.env.TOKEN, REDACTED);
  assert.equal(clean.github.command, 'npx');
  assert.equal(clean.remote.headers.Authorization, REDACTED);
  assert.equal(secrets['mcp.github.env.TOKEN'], 't1');
});

test('mergeSecrets round-trips sanitize', () => {
  const settingsIn = { env: { A: 'secret-a' }, model: 'opus' };
  const mcpIn = { srv: { command: 'x', env: { B: 'secret-b' } } };
  const s1 = sanitizeSettings(settingsIn);
  const s2 = sanitizeMcpServers(mcpIn);
  const secrets = { ...s1.secrets, ...s2.secrets };
  const settings = s1.clean;
  const mcpServers = s2.clean;
  const report = mergeSecrets({ settings, mcpServers }, secrets);
  assert.deepEqual(settings, settingsIn);
  assert.deepEqual(mcpServers, mcpIn);
  assert.equal(report.stillRedacted.length, 0);
});

test('mergeSecrets reports still-redacted when secrets missing', () => {
  const { clean } = sanitizeSettings({ env: { A: 'v' } });
  const report = mergeSecrets({ settings: clean, mcpServers: {} }, {});
  assert.deepEqual(report.stillRedacted, ['settings.env.A']);
});

test('platform matrix honest tiers', () => {
  assert.equal(platformsFor('skill')['claude-code'], 'auto');
  assert.equal(platformsFor('skill')['chatgpt'], 'paste-text');
  assert.equal(platformsFor('plugin')['chatgpt'], undefined);
  assert.equal(platformsFor('connector')['gemini-cli'], 'mcp');
});

test('shortSource normalizes github URLs', () => {
  assert.equal(shortSource('https://github.com/foo/bar.git'), 'github:foo/bar');
  assert.equal(shortSource('git@github.com:foo/bar.git'), 'github:foo/bar');
  assert.equal(shortSource(null), null);
});
