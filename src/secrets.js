// Secrets never reach the backup repo. Repo copies carry REDACTED markers;
// real values live in secrets.local.json which is gitignored. Restore merges
// them back when the file is present, otherwise prints a re-key checklist.

export const REDACTED = '«RISHIIDEV-REDACTED»';

const SECRET_KEY_RE = /token|key|secret|password|credential/i;

function isRedactable(value) {
  return typeof value === 'string' && value.length > 0 && value !== REDACTED;
}

// Redact every value of an { KEY: value } map (env blocks, headers).
// Returns { clean, secrets } where secrets maps key -> original value.
function redactMap(map, secrets, prefix) {
  const clean = {};
  for (const [k, v] of Object.entries(map || {})) {
    if (isRedactable(v)) {
      secrets[`${prefix}.${k}`] = v;
      clean[k] = REDACTED;
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

export function sanitizeSettings(settings) {
  const secrets = {};
  const clean = { ...settings };
  if (clean.env && typeof clean.env === 'object') {
    clean.env = redactMap(clean.env, secrets, 'settings.env');
  }
  for (const [k, v] of Object.entries(clean)) {
    if (k !== 'env' && SECRET_KEY_RE.test(k) && isRedactable(v)) {
      secrets[`settings.${k}`] = v;
      clean[k] = REDACTED;
    }
  }
  return { clean, secrets };
}

export function sanitizeMcpServers(servers) {
  const secrets = {};
  const clean = {};
  for (const [name, cfg] of Object.entries(servers || {})) {
    const c = { ...cfg };
    if (c.env) c.env = redactMap(c.env, secrets, `mcp.${name}.env`);
    if (c.headers) c.headers = redactMap(c.headers, secrets, `mcp.${name}.headers`);
    clean[name] = c;
  }
  return { clean, secrets };
}

// Merge stored secrets back into a sanitized object tree.
// pathKey format: "settings.env.FOO" / "mcp.<server>.env.FOO" / "settings.<key>"
export function mergeSecrets({ settings, mcpServers }, secrets) {
  const unresolved = [];
  const walkSet = (obj, keys, value) => {
    let cur = obj;
    for (const k of keys.slice(0, -1)) {
      if (!cur || typeof cur !== 'object') return false;
      cur = cur[k];
    }
    const last = keys[keys.length - 1];
    if (cur && typeof cur === 'object' && last in cur) {
      cur[last] = value;
      return true;
    }
    return false;
  };

  for (const [pathKey, value] of Object.entries(secrets || {})) {
    const parts = pathKey.split('.');
    let ok = false;
    if (parts[0] === 'settings' && settings) {
      ok = walkSet(settings, parts.slice(1), value);
    } else if (parts[0] === 'mcp' && mcpServers) {
      ok = walkSet(mcpServers, parts.slice(1), value);
    }
    if (!ok) unresolved.push(pathKey);
  }

  // anything still redacted needs manual re-keying
  const stillRedacted = [];
  const scan = (obj, trail) => {
    for (const [k, v] of Object.entries(obj || {})) {
      if (v === REDACTED) stillRedacted.push(`${trail}.${k}`);
      else if (v && typeof v === 'object' && !Array.isArray(v)) scan(v, `${trail}.${k}`);
    }
  };
  if (settings) scan(settings, 'settings');
  if (mcpServers) scan(mcpServers, 'mcp');

  return { unresolved, stillRedacted };
}
