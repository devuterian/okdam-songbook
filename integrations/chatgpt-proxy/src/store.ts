// In-memory stores for the OAuth code / refresh token lifecycle. Cloudflare
// Workers run inside isolates that are short-lived, so any state stored
// here is best-effort and may be reset on a redeploy or isolate churn.
// For a 1-user / 3-user internal tool this is acceptable: codes are valid
// for ~5 minutes and refresh tokens for ~30 days, both well within the
// expected lifetime of a Worker isolate. If this Worker ever needs to
// scale beyond a single instance, swap the maps for a Cloudflare KV
// namespace (the interface is intentionally narrow).

export interface PendingCode {
  sub: string;
  email: string;
  name: string;
  codeChallenge?: string;
  codeChallengeMethod?: "S256" | "plain";
  redirectUri: string;
  issuedAt: number;
}

export interface RefreshTokenRecord {
  sub: string;
  email: string;
  name: string;
  issuedAt: number;
}

interface Entry<T> {
  value: T;
  expiresAt: number;
}

export class CodeStore {
  private readonly codes = new Map<string, Entry<PendingCode>>();
  private readonly refreshTokens = new Map<string, Entry<RefreshTokenRecord>>();
  private readonly usedCodes = new Map<string, Entry<true>>();
  private readonly usedRefreshTokens = new Map<string, Entry<true>>();

  constructor(private readonly now: () => number = () => Date.now()) {}

  storeCode(code: string, value: PendingCode, ttlMs: number): void {
    this.codes.set(code, { value, expiresAt: this.now() + ttlMs });
  }

  takeCode(code: string): PendingCode | null {
    const entry = this.codes.get(code);
    if (!entry) return null;
    this.codes.delete(code);
    if (entry.expiresAt <= this.now()) {
      this.codes.delete(code);
      return null;
    }
    this.markCodeUsed(code, Math.max(60_000, entry.expiresAt - this.now()));
    return entry.value;
  }

  markCodeUsed(code: string, ttlMs: number): void {
    this.usedCodes.set(code, { value: true, expiresAt: this.now() + ttlMs });
  }

  isCodeUsed(code: string): boolean {
    const entry = this.usedCodes.get(code);
    if (!entry) return false;
    if (entry.expiresAt <= this.now()) {
      this.usedCodes.delete(code);
      return false;
    }
    return true;
  }

  peekCode(code: string): PendingCode | null {
    const entry = this.codes.get(code);
    if (!entry || entry.expiresAt <= this.now()) return null;
    return entry.value;
  }

  storeRefreshToken(token: string, value: RefreshTokenRecord, ttlSeconds: number): void {
    this.refreshTokens.set(token, { value, expiresAt: this.now() + ttlSeconds * 1000 });
  }

  takeRefreshToken(token: string): RefreshTokenRecord | null {
    const entry = this.refreshTokens.get(token);
    if (!entry) return null;
    if (entry.expiresAt <= this.now()) {
      this.refreshTokens.delete(token);
      return null;
    }
    // Refresh tokens are single-use: we delete on take so callers must
    // issue a rotation via `rotateRefreshToken` (or store a fresh token).
    this.refreshTokens.delete(token);
    this.markRefreshTokenUsed(token, Math.max(60_000, entry.expiresAt - this.now()));
    return entry.value;
  }

  markRefreshTokenUsed(token: string, ttlMs: number): void {
    this.usedRefreshTokens.set(token, { value: true, expiresAt: this.now() + ttlMs });
  }

  isRefreshTokenUsed(token: string): boolean {
    const entry = this.usedRefreshTokens.get(token);
    if (!entry) return false;
    if (entry.expiresAt <= this.now()) {
      this.usedRefreshTokens.delete(token);
      return false;
    }
    return true;
  }

  rotateRefreshToken(oldToken: string, newToken: string, value: RefreshTokenRecord, ttlSeconds: number): void {
    this.refreshTokens.delete(oldToken);
    this.storeRefreshToken(newToken, value, ttlSeconds);
  }

  // For tests.
  size(): number {
    return this.codes.size + this.refreshTokens.size + this.usedCodes.size + this.usedRefreshTokens.size;
  }
}
