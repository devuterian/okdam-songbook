// Minimal JWT helpers used only to compute the `exp` claim for client-side
// credential expiration checks. The Apps Script server validates the token's
// signature and claims; the payload here is never trusted for authorization.
export interface JwtPayload {
  exp?: number;
  email?: string;
  sub?: string;
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "===".slice((normalized.length + 3) % 4);
  if (typeof atob === "function") {
    return atob(padded);
  }
  // jsdom test envs without atob — fall back to manual decode.
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";
  for (let i = 0; i < padded.length; i += 4) {
    const a = alphabet.indexOf(padded[i] ?? "");
    const b = alphabet.indexOf(padded[i + 1] ?? "");
    const c = alphabet.indexOf(padded[i + 2] ?? "");
    const d = alphabet.indexOf(padded[i + 3] ?? "");
    const triplet = (a << 18) | (b << 12) | ((c & 63) << 6) | (d & 63);
    output += String.fromCharCode((triplet >> 16) & 255);
    if (padded[i + 2] !== "=") output += String.fromCharCode((triplet >> 8) & 255);
    if (padded[i + 3] !== "=") output += String.fromCharCode(triplet & 255);
  }
  return output;
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const raw = base64UrlDecode(parts[1] ?? "");
    return JSON.parse(raw) as JwtPayload;
  } catch {
    return null;
  }
}

export function jwtExpiresAt(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp || typeof payload.exp !== "number") return null;
  return payload.exp * 1000;
}

export function isJwtExpired(token: string, skewMs: number = 30_000, nowMs: number = Date.now()): boolean {
  const exp = jwtExpiresAt(token);
  if (exp === null) return true;
  return exp - skewMs <= nowMs;
}

export function isAuthErrorMessage(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { code?: unknown; error?: { code?: unknown } };
  const code = typeof candidate.code === "string" ? candidate.code : candidate.error?.code;
  return code === "UNAUTHORIZED";
}
