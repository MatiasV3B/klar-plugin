// Credenciales en ~/.klar/credentials.json (permisos 0600 en Unix; en Windows hereda la ACL privada del perfil).
// Guarda tokens de acceso/refresco, nunca contraseñas. Una entrada por servidor (nube real vs. desarrollo local).
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync, openSync, closeSync, statSync } from 'node:fs';
import { join } from 'node:path';

const file = (home) => join(home, 'credentials.json');

function readAll(home) {
  try { return JSON.parse(readFileSync(file(home), 'utf8')); } catch { return {}; }
}

function writeAll(home, data) {
  mkdirSync(home, { recursive: true, mode: 0o700 });
  const tmp = `${file(home)}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
  renameSync(tmp, file(home)); // reemplazo atómico: un hook leyendo a la vez nunca ve un archivo a medias
  try { chmodSync(file(home), 0o600); } catch { /* Windows */ }
}

export const loadCredentials = (home, apiUrl) => readAll(home)[apiUrl] ?? null;

export function saveCredentials(home, apiUrl, creds) {
  writeAll(home, { ...readAll(home), [apiUrl]: creds });
}

export function clearCredentials(home, apiUrl) {
  const all = readAll(home);
  delete all[apiUrl];
  writeAll(home, all);
}

/**
 * Candado de archivo para renovar el token. Imprescindible: los refresh tokens rotan, y si dos procesos
 * (dos hooks a la vez) renuevan el mismo token, el servidor lo toma por robo y cierra la sesión.
 */
export async function withLock(home, fn, { timeoutMs = 8000, staleMs = 15000 } = {}) {
  mkdirSync(home, { recursive: true, mode: 0o700 });
  const lock = join(home, 'refresh.lock');
  const start = Date.now();
  for (;;) {
    try { closeSync(openSync(lock, 'wx')); break; } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      try { if (Date.now() - statSync(lock).mtimeMs > staleMs) unlinkSync(lock); } catch { /* otro proceso lo liberó */ }
      if (Date.now() - start > timeoutMs) throw new Error('could not acquire the renewal lock');
      await new Promise((r) => setTimeout(r, 40 + Math.random() * 40));
    }
  }
  try { return await fn(); } finally { try { unlinkSync(lock); } catch { /* ya no existe */ } }
}

export const pendingFile = (home) => join(home, 'pending-login.json');
export const hasFile = existsSync;
