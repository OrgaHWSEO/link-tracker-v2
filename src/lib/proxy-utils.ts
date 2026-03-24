/**
 * Normalise une URL proxy depuis plusieurs formats d'entrée vers
 * le format URL standard stocké en base (http://user:pass@host:port).
 *
 * Formats acceptés :
 *   host:port                     → http://host:port
 *   host:port:password            → http://:password@host:port
 *   host:port:user:password       → http://user:password@host:port
 *   http://[user:pass@]host:port  → inchangé (déjà valide)
 *   socks4://...  socks5://...    → inchangé
 */

const URL_PROTOCOLS = ["http://", "https://", "socks4://", "socks5://"];

function validPort(s: string): boolean {
  const n = parseInt(s, 10);
  return !isNaN(n) && n >= 1 && n <= 65535;
}

export function normalizeProxyUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  // ── Déjà au format URL ───────────────────────────────────────
  if (URL_PROTOCOLS.some((p) => raw.startsWith(p))) {
    try { new URL(raw); return raw; }
    catch { return null; }
  }

  // ── Format host:port[:pass] ou host:port:user:pass ───────────
  // On split en 4 parties max pour ne pas couper les passwords contenant ":"
  const idx1 = raw.indexOf(":");              // position du premier ":"
  if (idx1 === -1) return null;

  const host = raw.slice(0, idx1);
  const rest = raw.slice(idx1 + 1);          // "port" ou "port:pass" ou "port:user:pass"

  const idx2 = rest.indexOf(":");
  const port  = idx2 === -1 ? rest : rest.slice(0, idx2);
  const after = idx2 === -1 ? ""   : rest.slice(idx2 + 1); // "pass" ou "user:pass"

  if (!host || !validPort(port)) return null;

  if (!after) {
    // host:port uniquement
    return `http://${host}:${port}`;
  }

  const idx3 = after.indexOf(":");
  if (idx3 === -1) {
    // host:port:password  (pas de username)
    const pass = encodeURIComponent(after);
    return `http://:${pass}@${host}:${port}`;
  }

  // host:port:user:password  (le reste après le 3e ":" est le password complet)
  const user = after.slice(0, idx3);
  const pass = after.slice(idx3 + 1);
  return `http://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}`;
}

export function isValidProxyInput(input: string): boolean {
  return normalizeProxyUrl(input) !== null;
}
