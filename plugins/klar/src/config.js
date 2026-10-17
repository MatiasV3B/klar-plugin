// Configuración del cliente. Es lo único "de Klar" que vive en la máquina del usuario: ningún secreto, ninguna regla de detección.
import { homedir } from 'node:os';
import { join } from 'node:path';

// ⚠ Placeholder: se cambia por el dominio real cuando se despliegue Klar Cloud.
export const DEFAULT_API_URL = 'https://klar-cloud.vercel.app';

export function readConfig(env = process.env) {
  const profile = ['default', 'banking', 'credit', 'browsing'].includes(env.KLAR_PROFILE) ? env.KLAR_PROFILE : 'default';
  return {
    apiUrl: (env.KLAR_API_URL || DEFAULT_API_URL).replace(/\/$/, ''),
    home: env.KLAR_HOME || join(homedir(), '.klar'),
    profile,
    mode: env.KLAR_MODE === 'block' ? 'block' : 'warn',
    // Si Klar no responde: los perfiles de dinero fallan cerrado (piden revisión), el resto avisa y sigue.
    failClosed: ['banking', 'credit'].includes(profile),
  };
}
