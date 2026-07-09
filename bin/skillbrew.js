#!/usr/bin/env node
import { init } from '../src/init.js';
import { snapshot } from '../src/snapshot.js';
import { restore } from '../src/restore.js';
import { packCreate, packList, packInstall } from '../src/packs.js';
import { exportChat } from '../src/export.js';
import { install } from '../src/install.js';
import { list } from '../src/list.js';

const HELP = `skillbrew — backup, restore, sync and bundle your Claude Code setup

Usage:
  skillbrew init [dir] [--github]        create backup repo (default ~/skillbrew-backup); --github makes private remote via gh
  skillbrew snapshot                     save skills/agents/config/plugins/connectors to repo, commit + push
  skillbrew restore [--pack <name>]      rebuild ~/.claude from repo (current state backed up first, never deleted)
  skillbrew pack create <name> <s...>    save named skill collection
  skillbrew pack list                    show packs
  skillbrew pack install <name>          install just that pack's skills
  skillbrew export --chat [--pack p]     build claude.ai-uploadable zips into exports/
  skillbrew install <spec> [--pack p]    install skills from another skillbrew repo (github:user/repo, url, or path)
  skillbrew list                         show tracked items with platform badges

Env: SKILLBREW_CLAUDE_HOME, SKILLBREW_CLAUDE_JSON, SKILLBREW_REPO, SKILLBREW_CONFIG (test/CI overrides)
`;

function flag(args, name) {
  const i = args.indexOf(name);
  if (i === -1) return { present: false, value: null, rest: args };
  const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null;
  const rest = args.filter((_, j) => j !== i && !(value && j === i + 1));
  return { present: true, value, rest };
}

const [cmd, ...args] = process.argv.slice(2);

try {
  switch (cmd) {
    case 'init': {
      const gh = flag(args, '--github');
      init(gh.rest[0], { github: gh.present });
      break;
    }
    case 'snapshot':
      snapshot();
      break;
    case 'restore': {
      const p = flag(args, '--pack');
      restore({ pack: p.value });
      break;
    }
    case 'pack': {
      const [sub, ...rest] = args;
      if (sub === 'create') packCreate(rest[0], rest.slice(1));
      else if (sub === 'list') packList();
      else if (sub === 'install') packInstall(rest[0]);
      else throw new Error('usage: skillbrew pack create|list|install');
      break;
    }
    case 'export': {
      const chat = flag(args, '--chat');
      if (!chat.present) throw new Error('usage: skillbrew export --chat [--pack <name>]');
      const p = flag(chat.rest, '--pack');
      exportChat({ pack: p.value });
      break;
    }
    case 'install': {
      const p = flag(args, '--pack');
      const f = flag(p.rest, '--force');
      install(f.rest[0], { pack: p.value, force: f.present });
      break;
    }
    case 'list':
      list();
      break;
    case 'help':
    case undefined:
    case '--help':
      console.log(HELP);
      break;
    default:
      console.error(`skillbrew: unknown command "${cmd}"\n`);
      console.log(HELP);
      process.exit(1);
  }
} catch (err) {
  console.error(`skillbrew: ${err.message}`);
  process.exit(1);
}
