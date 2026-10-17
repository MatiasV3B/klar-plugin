#!/usr/bin/env node
// CLI de Klar:  klar login | logout | status | inspect
import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createClient, clip, KlarError } from '../src/api.js';
import { readConfig } from '../src/config.js';

const cfg = readConfig();
const client = createClient({ apiUrl: cfg.apiUrl, home: cfg.home });
const [cmd, ...args] = process.argv.slice(2);
const option = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function openBrowser(url) {
  const [bin, ...a] = process.platform === 'win32' ? ['cmd', '/c', 'start', '""', url.replace(/&/g, '^&')] : process.platform === 'darwin' ? ['open', url] : ['xdg-open', url];
  execFile(bin, a, () => {}); // si no hay navegador, el usuario ya tiene la URL impresa
}

async function login() {
  if (client.isLoggedIn() && !args.includes('--force')) { console.log('You are already signed in. Use `klar status` or `klar login --force`.'); return 0; }
  const p = await client.loginStart();
  console.log(`\nTo connect this device, open:\n  ${p.verification_uri_complete}\n\nCode: ${p.user_code}\n`);
  if (!args.includes('--no-browser')) openBrowser(p.verification_uri_complete);
  let wait = p.interval * 1000;
  while (Date.now() < p.expires_at) {
    await sleep(wait + 200);
    const { status } = await client.loginPoll();
    if (status === 'ok') { console.log('✔ Signed in.'); return 0; }
    if (status === 'slow_down') wait += 5000;
    if (['denied', 'expired', 'none'].includes(status)) { console.error(`✘ ${status === 'denied' ? 'Access cancelled.' : 'The code expired. Run `klar login` again.'}`); return 1; }
  }
  console.error('✘ The code expired.');
  return 1;
}

async function main() {
  switch (cmd) {
    case 'login': return login();
    case 'logout': console.log((await client.logout()) ? 'Signed out.' : 'You were not signed in.'); return 0;
    case 'status': {
      const me = await client.me();
      console.log(`${me.email} · plan ${me.plan} · ${me.usage.used}/${me.usage.limit} reviews this month · profiles: ${me.limits.profiles.join(', ')}\nServer: ${cfg.apiUrl}`);
      return 0;
    }
    case 'inspect': {
      const file = args.find((a, i) => !a.startsWith('--') && !['--source', '--profile', '--url'].includes(args[i - 1]));
      const content = file ? readFileSync(file, 'utf8') : readFileSync(0, 'utf8');
      const r = await client.inspect({ source: option('source') ?? 'unknown', profile: option('profile') ?? cfg.profile, url: option('url'), ...(args.includes('--html') ? { html: clip(content) } : { text: clip(content) }) });
      if (args.includes('--json')) console.log(JSON.stringify(r, null, 2));
      else {
        console.log(`${{ allow: 'ALLOW', flag: 'FLAG', block: 'BLOCK' }[r.action]} · score ${r.score}/100 · profile ${r.profile}`);
        for (const f of [...r.findings].sort((a, b) => b.severity - a.severity).slice(0, 5)) console.log(`  · [${f.vector}] ${f.id} (${f.severity})`);
        console.log(`Usage this month: ${r.usage.used}/${r.usage.limit}`);
      }
      return { allow: 0, flag: 1, block: 2 }[r.action]; // 0 permitir · 1 marcar · 2 bloquear
    }
    default:
      console.error('Usage: klar login [--force] [--no-browser] | logout | status | inspect [file] [--source web|pdf|…] [--html] [--profile …] [--json]');
      return 64;
  }
}

// exitCode en vez de process.exit(): en Windows, salir a la fuerza con un fetch en vuelo puede abortar Node.
main().then((code) => { process.exitCode = code; }, (e) => {
  console.error(`✘ ${e.message}`);
  process.exitCode = e instanceof KlarError && e.kind === 'not_logged_in' ? 3 : 70;
});
