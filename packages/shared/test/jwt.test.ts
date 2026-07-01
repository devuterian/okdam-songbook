import { describe, expect, it } from "vitest";
import { decodeJwtPayload, isAuthErrorMessage, isJwtExpired, jwtExpiresAt } from "../src/auth/jwt";

function base64UrlEncode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function encode(payload: Record<string, unknown>): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

describe("jwt helpers", () => {
  it("decodes the payload", () => {
    const token = encode({ exp: 1_700_000_000, email: "marie@example.com" });
    expect(decodeJwtPayload(token)).toMatchObject({ exp: 1_700_000_000, email: "marie@example.com" });
  });

  it("returns null for malformed tokens", () => {
    expect(decodeJwtPayload("")).toBeNull();
    expect(decodeJwtPayload("not-a-jwt")).toBeNull();
  });

  it("treats expired tokens as expired", () => {
    const token = encode({ exp: Math.floor(Date.now() / 1000) - 60 });
    expect(jwtExpiresAt(token)).not.toBeNull();
    expect(isJwtExpired(token, 0)).toBe(true);
  });

  it("treats tokens within the skew window as expired", () => {
    const token = encode({ exp: Math.floor(Date.now() / 1000) + 5 });
    expect(isJwtExpired(token, 30_000)).toBe(true);
  });

  it("keeps fresh tokens valid", () => {
    const token = encode({ exp: Math.floor(Date.now() / 1000) + 600 });
    expect(isJwtExpired(token, 30_000)).toBe(false);
  });

  it("flags missing exp as expired", () => {
    const token = encode({ email: "x@example.com" });
    expect(isJwtExpired(token)).toBe(true);
  });

  it("detects UNAUTHORIZED error shapes", () => {
    expect(isAuthErrorMessage({ code: "UNAUTHORIZED", message: "x" })).toBe(true);
    expect(isAuthErrorMessage({ error: { code: "UNAUTHORIZED" } })).toBe(true);
    expect(isAuthErrorMessage({ code: "FORBIDDEN" })).toBe(false);
    expect(isAuthErrorMessage("UNAUTHORIZED")).toBe(false);
    expect(isAuthErrorMessage(null)).toBe(false);
  });
});
