// Environment binding for the Cloudflare Worker. wrangler.toml maps these
// to either `vars` (plaintext) or `secrets` (encrypted). The three
// allowed emails and the GPT OAuth client credentials live in secrets so
// they never appear in source control.

export interface WorkerConfig {
  googleClientId: string;
  googleClientSecret: string;
  appsScriptUrl: string;
  internalProxySecret: string;
  gptOAuthClientId: string;
  gptOAuthClientSecret: string;
  allowedEmails: {
    marie: string;
    seongwook: string;
    yeowool: string;
  };
  cookieSecret: string;
  sessionTtlSeconds: number;
  callbackBaseUrl: string;
  chatgptRedirectUriAllowList: string[];
  codeStoreTtlMs: number;
  refreshTokenTtlSeconds: number;
}

export function readConfig(env: Record<string, string | undefined>): WorkerConfig {
  const get = (key: string): string => {
    const value = env[key];
    if (!value) throw new Error(`Worker secret/vars missing: ${key}`);
    return value;
  };
  const allowList = String(env.CHATGPT_REDIRECT_URI_ALLOWLIST || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const fallback = String(env.CHATGPT_REDIRECT_URI || "").trim();
  const redirectAllowList = allowList.length ? allowList : fallback ? [fallback] : [];
  return {
    googleClientId: get("GOOGLE_CLIENT_ID"),
    googleClientSecret: get("GOOGLE_CLIENT_SECRET"),
    appsScriptUrl: get("APPS_SCRIPT_URL"),
    internalProxySecret: get("INTERNAL_PROXY_SECRET"),
    gptOAuthClientId: get("GPT_OAUTH_CLIENT_ID"),
    gptOAuthClientSecret: get("GPT_OAUTH_CLIENT_SECRET"),
    allowedEmails: {
      marie: String(env.MARIE_EMAIL || "").trim().toLowerCase(),
      seongwook: String(env.SEONGWOOK_EMAIL || "").trim().toLowerCase(),
      yeowool: String(env.YEOWOOL_EMAIL || "").trim().toLowerCase()
    },
    cookieSecret: get("COOKIE_SECRET"),
    sessionTtlSeconds: Number(env.SESSION_TTL_SECONDS || 60 * 60 * 12),
    callbackBaseUrl: String(env.CALLBACK_BASE_URL || "https://chatgpt-proxy.example.com").replace(/\/$/, ""),
    chatgptRedirectUriAllowList: redirectAllowList,
    codeStoreTtlMs: Number(env.CODE_STORE_TTL_MS || 5 * 60_000),
    refreshTokenTtlSeconds: Number(env.REFRESH_TOKEN_TTL_SECONDS || 60 * 60 * 24 * 30)
  };
}

export const ALLOWED_ACTIONS = new Set(["gptSearchSongs", "gptCheckDuplicate", "gptAddSong"]);

export function isAllowedAction(action: string): boolean {
  return ALLOWED_ACTIONS.has(action);
}
