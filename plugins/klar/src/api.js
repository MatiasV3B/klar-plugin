// Cliente de Klar Cloud. Solo habla HTTP: la detección ocurre en el servidor.
import { clearCredentials, loadCredentials, pendingFile, saveCredentials, withLock } from './credentials.js';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export class KlarError extends Error {
  /** kind: not_logged_in | subscription | quota | rate_limited | plan | invalid | network | server */
  constructor(kind, message, extra = {}) { super(message); this.kind = kind; Object.assign(this, extra); }
}

const CLI_CLIENT_ID = 'klar-cli';
const form = (obj) => new URLSearchParams(obj);

export function createClient({ apiUrl, home, fetchImpl = globalThis.fetch, timeoutMs = 6000, now = Date.now }) {
  async function send(path, init = {}, token) {
    try {
      return await fetchImpl(`${apiUrl}${path}`, {
        ...init,
        headers: { ...(init.headers ?? {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (e) {
      throw new KlarError('network', e.name === 'TimeoutError' ? 'Klar no respondió a tiempo' : `no se pudo conectar con Klar (${e.cause?.code ?? e.message})`);
    }
  }

  const creds = () => loadCredentials(home, apiUrl);

  /** Renueva con candado: si otro proceso ya renovó mientras esperábamos, se usa su resultado. */
  async function refresh(stale) {
    return withLock(home, async () => {
      const cur = creds();
      if (!cur) throw new KlarError('not_logged_in', 'No has iniciado sesión en Klar. Ejecuta `klar login`.');
      if (cur.access_token !== stale.access_token) return cur;
      const res = await send('/oauth/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form({ grant_type: 'refresh_token', refresh_token: cur.refresh_token, client_id: CLI_CLIENT_ID }) });
      if (res.status === 400 || res.status === 401) {
        clearCredentials(home, apiUrl);
        throw new KlarError('not_logged_in', 'Tu sesión de Klar caducó o fue revocada. Ejecuta `klar login`.');
      }
      if (!res.ok) throw new KlarError('server', `Klar respondió ${res.status} al renovar la sesión`);
      return store(await res.json(), cur);
    });
  }

  const store = (tok, prev = {}) => {
    const next = { ...prev, access_token: tok.access_token, refresh_token: tok.refresh_token, expires_at: now() + tok.expires_in * 1000 };
    saveCredentials(home, apiUrl, next);
    return next;
  };

  async function authed(path, init) {
    let c = creds();
    if (!c) throw new KlarError('not_logged_in', 'No has iniciado sesión en Klar. Ejecuta `klar login`.');
    if (c.expires_at - now() < 30_000) c = await refresh(c);
    let res = await send(path, init, c.access_token);
    if (res.status === 401) {
      c = await refresh(c);
      res = await send(path, init, c.access_token);
      if (res.status === 401) throw new KlarError('not_logged_in', 'Klar rechazó tu sesión. Ejecuta `klar login`.');
    }
    return res;
  }

  async function failure(res) {
    const body = await res.json().catch(() => ({}));
    const retryAfter = Number(res.headers.get('retry-after')) || undefined;
    if (res.status === 429) return new KlarError(body.error === 'quota_exceeded' ? 'quota' : 'rate_limited', body.error_description ?? 'límite alcanzado', { retryAfter, upgradeUrl: body.upgrade_url });
    if (res.status === 402) return new KlarError('subscription', body.error_description ?? 'necesitas una suscripción activa', { upgradeUrl: body.upgrade_url });
    if (res.status === 403) return new KlarError('plan', body.error_description ?? 'no incluido en tu plan');
    if (res.status === 400 || res.status === 413) return new KlarError('invalid', body.error_description ?? 'solicitud inválida');
    return new KlarError('server', `Klar respondió ${res.status}`);
  }

  return {
    isLoggedIn: () => Boolean(creds()),

    async inspect(body) {
      const res = await authed('/v1/inspect', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw await failure(res);
      return res.json();
    },

    async me() {
      const res = await authed('/v1/me');
      if (!res.ok) throw await failure(res);
      return res.json();
    },

    /** Reenvía un mensaje JSON-RPC al MCP remoto. Devuelve la respuesta o null si fue una notificación. */
    async rpc(message) {
      const res = await authed('/mcp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(message) });
      if (res.status === 202) return null;
      if (!res.ok) throw await failure(res);
      return res.json();
    },

    // ── Inicio de sesión (flujo de dispositivo, RFC 8628) ────────────────────────
    async loginStart() {
      const res = await send('/oauth/device/code', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form({ client_id: CLI_CLIENT_ID }) });
      if (!res.ok) throw new KlarError('server', `Klar respondió ${res.status} al iniciar sesión`);
      const d = await res.json();
      const pending = { device_code: d.device_code, user_code: d.user_code, verification_uri: d.verification_uri, verification_uri_complete: d.verification_uri_complete, interval: d.interval, expires_at: now() + d.expires_in * 1000 };
      mkdirSync(dirname(pendingFile(home)), { recursive: true, mode: 0o700 });
      writeFileSync(pendingFile(home), JSON.stringify({ apiUrl, ...pending }), { mode: 0o600 });
      return pending;
    },

    pendingLogin() {
      try {
        const p = JSON.parse(readFileSync(pendingFile(home), 'utf8'));
        return p.apiUrl === apiUrl && p.expires_at > now() ? p : null;
      } catch { return null; }
    },

    /** Una consulta: 'pending' | 'slow_down' | 'ok' | 'denied' | 'expired' | 'none'. */
    async loginPoll() {
      const p = this.pendingLogin();
      if (!p) return { status: 'none' };
      const res = await send('/oauth/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form({ grant_type: 'urn:ietf:params:oauth:grant-type:device_code', device_code: p.device_code, client_id: CLI_CLIENT_ID }) });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        store(body);
        if (existsSync(pendingFile(home))) unlinkSync(pendingFile(home));
        return { status: 'ok' };
      }
      const map = { authorization_pending: 'pending', slow_down: 'slow_down', access_denied: 'denied', expired_token: 'expired' };
      if (['access_denied', 'expired_token'].includes(body.error) && existsSync(pendingFile(home))) unlinkSync(pendingFile(home));
      return { status: map[body.error] ?? 'expired' };
    },

    async logout() {
      const c = creds();
      if (c) await send('/oauth/revoke', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form({ token: c.refresh_token }) }).catch(() => {});
      clearCredentials(home, apiUrl);
      return Boolean(c);
    },
  };
}

/** Recorte antes de enviar: conserva cabeza y cola (donde se esconden los ataques) y deja que el servidor marque el desbordamiento. */
export function clip(s, max = 200_000) {
  if (typeof s !== 'string' || s.length <= max) return s;
  const head = Math.floor(max * 0.6);
  return `${s.slice(0, head)}\n…\n${s.slice(-(max - head))}`;
}
