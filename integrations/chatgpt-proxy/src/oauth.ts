// Google OAuth helpers + Worker-side access/refresh token minting for
// Custom GPT consumers. We use HS256 for the access token because the
// same secret is used to sign and verify; the secret never leaves the
// Worker boundary.

import {
  constantTimeEquals,
  createSessionToken,
  normalizeEmail,
  verifySessionToken,
  type OAuthSessionClaims,
  type SignedToken
} from "@songbook/shared";

export interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
}

export interface GoogleTokens {
  access_token: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
}

export interface StateCookieClaims {
  state: string;
  gptRedirectUri: string;
  codeChallenge?: string;
  codeChallengeMethod?: "S256" | "plain";
  returnTo?: string;
}

const STATE_SUBJECT = "state";
const SESSION_SUBJECT = "session";
const CODE_SUBJECT = "authorization-code";
const REFRESH_SUBJECT = "refresh";

export interface AccessTokenClaims extends OAuthSessionClaims {
  typ: "access";
  jti: string;
}

export function buildAuthorizationUrl(input: {
  clientId: string;
  redirectUri: string;
  state: string;
  scope: string;
  prompt?: string;
}): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", input.scope);
  url.searchParams.set("state", input.state);
  url.searchParams.set("access_type", "online");
  url.searchParams.set("include_granted_scopes", "true");
  if (input.prompt) url.searchParams.set("prompt", input.prompt);
  return url.toString();
}

export async function exchangeCodeForTokens(input: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  fetchImpl?: typeof fetch;
}): Promise<GoogleTokens> {
  const doFetch = input.fetchImpl ?? fetch;
  const response = await doFetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: input.clientId,
      client_secret: input.clientSecret,
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code"
    }).toString()
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google token exchange failed: ${response.status} ${text}`);
  }
  const json = (await response.json()) as GoogleTokens;
  if (!json.access_token) throw new Error("Google token response missing access_token");
  return json;
}

export async function fetchGoogleUserInfo(accessToken: string, fetchImpl?: typeof fetch): Promise<GoogleUserInfo> {
  const doFetch = fetchImpl ?? fetch;
  const response = await doFetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google userinfo failed: ${response.status} ${text}`);
  }
  const json = (await response.json()) as Record<string, unknown>;
  const sub = String(json.sub || "");
  const email = String(json.email || "").toLowerCase();
  if (!sub || !email) throw new Error("Google userinfo missing sub/email");
  if (String(json.email_verified) !== "true") throw new Error("Google email is not verified");
  return {
    sub,
    email,
    email_verified: true,
    name: String(json.name || email.split("@")[0])
  };
}

export interface SignAndVerifyStateOptions {
  cookieSecret: string;
  ttlSeconds: number;
  nowMs?: number;
}

export async function signStateCookie(value: StateCookieClaims, options: SignAndVerifyStateOptions): Promise<string> {
  const token = await createSessionToken({
    secret: options.cookieSecret,
    sub: STATE_SUBJECT,
    email: "state@cookie",
    name: STATE_SUBJECT,
    ttlSeconds: options.ttlSeconds,
    nowMs: options.nowMs,
    extraClaims: {
      state: value.state,
      gptRedirectUri: value.gptRedirectUri,
      codeChallenge: value.codeChallenge,
      codeChallengeMethod: value.codeChallengeMethod,
      returnTo: value.returnTo
    }
  });
  return token.token;
}

export async function verifyStateCookie(token: string, cookieSecret: string, nowMs?: number): Promise<StateCookieClaims | null> {
  const claims = await verifySessionToken(token, cookieSecret, nowMs);
  if (!claims || claims.sub !== STATE_SUBJECT) return null;
  const extra = claims as unknown as Partial<StateCookieClaims>;
  if (typeof extra.state !== "string") return null;
  if (typeof extra.gptRedirectUri !== "string") return null;
  return {
    state: extra.state,
    gptRedirectUri: extra.gptRedirectUri,
    codeChallenge: extra.codeChallenge,
    codeChallengeMethod: extra.codeChallengeMethod,
    returnTo: extra.returnTo
  };
}

export interface CreateSessionInput {
  sub: string;
  email: string;
  name: string;
  sessionSecret: string;
  ttlSeconds: number;
  nowMs?: number;
}

export async function createSession(input: CreateSessionInput): Promise<SignedToken> {
  return await createSessionToken({
    secret: input.sessionSecret,
    sub: input.sub,
    email: normalizeEmail(input.email),
    name: input.name,
    ttlSeconds: input.ttlSeconds,
    nowMs: input.nowMs
  });
}

export async function verifySession(token: string, secret: string, nowMs?: number): Promise<OAuthSessionClaims | null> {
  return await verifySessionToken(token, secret, nowMs);
}

export interface MintAccessTokenInput {
  signingSecret: string;
  sub: string;
  email: string;
  name: string;
  ttlSeconds: number;
  jti: string;
  nowMs?: number;
}

export async function mintAccessToken(input: MintAccessTokenInput): Promise<SignedToken> {
  return await createSessionToken({
    secret: input.signingSecret,
    sub: SESSION_SUBJECT,
    email: normalizeEmail(input.email),
    name: input.name,
    ttlSeconds: input.ttlSeconds,
    nowMs: input.nowMs,
    extraClaims: { typ: "access", originalSub: input.sub, jti: input.jti }
  });
}

export interface VerifyAccessTokenResult {
  sub: string;
  email: string;
  name: string;
  jti: string;
}

export async function verifyAccessToken(token: string, secret: string, nowMs?: number): Promise<VerifyAccessTokenResult | null> {
  const claims = await verifySessionToken(token, secret, nowMs);
  if (!claims) return null;
  if (claims.sub !== SESSION_SUBJECT) return null;
  const extra = claims as unknown as { typ?: unknown; originalSub?: unknown; jti?: unknown };
  if (extra.typ !== "access") return null;
  if (typeof extra.originalSub !== "string") return null;
  if (typeof extra.jti !== "string") return null;
  return {
    sub: extra.originalSub,
    email: claims.email,
    name: claims.name,
    jti: extra.jti
  };
}

export interface AuthorizationCodeClaims {
  sub: string;
  email: string;
  name: string;
  codeChallenge?: string;
  codeChallengeMethod?: "S256" | "plain";
  redirectUri: string;
  issuedAt: number;
}

export async function mintAuthorizationCode(input: AuthorizationCodeClaims & {
  signingSecret: string;
  ttlSeconds: number;
  nowMs?: number;
}): Promise<SignedToken> {
  return await createSessionToken({
    secret: input.signingSecret,
    sub: CODE_SUBJECT,
    email: normalizeEmail(input.email),
    name: input.name,
    ttlSeconds: input.ttlSeconds,
    nowMs: input.nowMs,
    extraClaims: {
      originalSub: input.sub,
      codeChallenge: input.codeChallenge,
      codeChallengeMethod: input.codeChallengeMethod,
      redirectUri: input.redirectUri,
      issuedAt: input.issuedAt
    }
  });
}

export async function verifyAuthorizationCode(token: string, secret: string, nowMs?: number): Promise<AuthorizationCodeClaims | null> {
  const claims = await verifySessionToken(token, secret, nowMs);
  if (!claims || claims.sub !== CODE_SUBJECT) return null;
  const extra = claims as unknown as { originalSub?: unknown; codeChallenge?: unknown; codeChallengeMethod?: unknown; redirectUri?: unknown; issuedAt?: unknown };
  if (typeof extra.originalSub !== "string") return null;
  if (typeof extra.redirectUri !== "string") return null;
  return {
    sub: extra.originalSub,
    email: claims.email,
    name: claims.name,
    codeChallenge: typeof extra.codeChallenge === "string" ? extra.codeChallenge : undefined,
    codeChallengeMethod: extra.codeChallengeMethod === "S256" || extra.codeChallengeMethod === "plain" ? extra.codeChallengeMethod : undefined,
    redirectUri: extra.redirectUri,
    issuedAt: typeof extra.issuedAt === "number" ? extra.issuedAt : claims.iat * 1000
  };
}

export interface RefreshTokenClaims {
  sub: string;
  email: string;
  name: string;
  issuedAt: number;
}

export async function mintRefreshToken(input: RefreshTokenClaims & {
  signingSecret: string;
  ttlSeconds: number;
  nowMs?: number;
}): Promise<SignedToken> {
  return await createSessionToken({
    secret: input.signingSecret,
    sub: REFRESH_SUBJECT,
    email: normalizeEmail(input.email),
    name: input.name,
    ttlSeconds: input.ttlSeconds,
    nowMs: input.nowMs,
    extraClaims: {
      originalSub: input.sub,
      issuedAt: input.issuedAt
    }
  });
}

export async function verifyRefreshToken(token: string, secret: string, nowMs?: number): Promise<RefreshTokenClaims | null> {
  const claims = await verifySessionToken(token, secret, nowMs);
  if (!claims || claims.sub !== REFRESH_SUBJECT) return null;
  const extra = claims as unknown as { originalSub?: unknown; issuedAt?: unknown };
  if (typeof extra.originalSub !== "string") return null;
  return {
    sub: extra.originalSub,
    email: claims.email,
    name: claims.name,
    issuedAt: typeof extra.issuedAt === "number" ? extra.issuedAt : claims.iat * 1000
  };
}

async function sha256(input: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hash);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    const value = bytes[i];
    if (value !== undefined) binary += String.fromCharCode(value);
  }
  const b64 = typeof btoa === "function" ? btoa(binary) : "";
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function verifyPkce(input: {
  codeVerifier: string;
  codeChallenge: string;
  method: "S256" | "plain";
}): Promise<boolean> {
  if (input.method === "plain") {
    return constantTimeEquals(input.codeVerifier, input.codeChallenge);
  }
  const derived = await sha256(input.codeVerifier);
  const derivedB64 = bytesToBase64Url(derived);
  return constantTimeEquals(derivedB64, input.codeChallenge);
}

export async function generateAuthorizationCode(): Promise<string> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}
