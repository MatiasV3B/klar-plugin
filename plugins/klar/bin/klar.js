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
  if (client.isLoggedIn() && !args.includes('--force')) { console.log('Ya tienes la sesión iniciada. Usa `klar status` o `klar login --force`.'); return 0; }
  const p = await client.loginStart();
  console.log(`\nPara conectar este dispositivo abre:\n  ${p.verification_uri_complete}\n\nCódigo: ${p.user_code}\n`);
  if (!args.includes('--no-browser')) openBrowser(p.verification_uri_complete);
  let wait = p.interval * 1000;
  while (Date.now() < p.expires_at) {
    await sleep(wait + 200);
    const { status } = await client.loginPoll();
    if (status === 'ok') { console.log('✔ Sesión iniciada.'); return 0; }
    if (status === 'slow_down') wait += 5000;
    if (['denied', 'expired', 'none'].includes(status)) { console.error(`✘ ${status === 'denied' ? 'Cancelaste el acceso.' : 'El código expiró. Vuelve a ejecutar `klar login`.'}`); return 1; }
  }
  console.error('✘ El código expiró.');
  return 1;
}

async function main() {
  switch (cmd) {
    case 'login': return login();
    case 'logout': console.log((await client.logout()) ? 'Sesión cerrada.' : 'No había sesión.'); return 0;
    case 'status': {
      const me = await client.me();
      console.log(`${me.email} · plan ${me.plan} · ${me.usage.used}/${me.usage.limit} revisiones este mes · perfiles: ${me.limits.profiles.join(', ')}\nServidor: ${cfg.apiUrl}`);
      return 0;
    }
    case 'inspect': {
      const file = args.find((a, i) => !a.startsWith('--') && !['--source', '--profile', '--url'].includes(args[i - 1]));
      const content = file ? readFileSync(file, 'utf8') : readFileSync(0, 'utf8');
      const r = await client.inspect({ source: option('source') ?? 'unknown', profile: option('profile') ?? cfg.profile, url: option('url'), ...(args.includes('--html') ? { html: clip(content) } : { text: clip(content) }) });
      if (args.includes('--json')) console.log(JSON.stringify(r, null, 2));
      else {
        console.log(`${{ allow: 'PERMITIR', flag: 'MARCAR', block: 'BLOQUEAR' }[r.action]} · puntaje ${r.score}/100 · perfil ${r.profile}`);
        for (const f of [...r.findings].sort((a, b) => b.severity - a.severity).slice(0, 5)) console.log(`  · [${f.vector}] ${f.id} (${f.severity}): ${f.evidence}`);
        console.log(`Uso del mes: ${r.usage.used}/${r.usage.limit}`);
      }
      return { allow: 0, flag: 1, block: 2 }[r.action]; // 0 permitir · 1 marcar · 2 bloquear
    }
    default:
      console.error('Uso: klar login [--force] [--no-browser] | logout | status | inspect [archivo] [--source web|pdf|…] [--html] [--profile …] [--json]');
      return 64;
  }
}

// exitCode en vez de process.exit(): en Windows, salir a la fuerza con un fetch en vuelo puede abortar Node.
main().then((code) => { process.exitCode = code; }, (e) => {
  console.error(`✘ ${e.message}`);
  process.exitCode = e instanceof KlarError && e.kind === 'not_logged_in' ? 3 : 70;
});
