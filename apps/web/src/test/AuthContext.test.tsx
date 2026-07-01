import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth, AuthRequiredError, type AuthContextValue } from "../lib/auth/AuthContext";
import { isApiAuthError } from "../lib/api";

const clientId = "test-client-id.apps.googleusercontent.com";

const tokenClaims = {
  valid: { exp: Math.floor(Date.now() / 1000) + 600, email: "marie@example.com" },
  expired: { exp: Math.floor(Date.now() / 1000) - 60, email: "marie@example.com" }
};

function encodeToken(claims: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" })).replace(/=+$/, "");
  const body = btoa(JSON.stringify(claims)).replace(/=+$/, "");
  return `${header}.${body}.signature`;
}

const mockFetch = vi.fn();

type GISCredentialCallback = (response: { credential?: string }) => void;

interface FakeGISHandle {
  fire(credential: string | null): void;
}

function installFakeGIS(): FakeGISHandle {
  let callback: GISCredentialCallback | null = null;
  const id = {
    initialize({ callback: cb }: { callback: GISCredentialCallback }) {
      callback = cb;
    },
    renderButton() {
      /* no-op */
    },
    prompt(notificationCb?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean; isDismissedMoment: () => boolean }) => void) {
      notificationCb?.({ isNotDisplayed: () => false, isSkippedMoment: () => false, isDismissedMoment: () => false });
    }
  };
  (window as unknown as { google: { accounts: { id: typeof id } } }).google = { accounts: { id } };
  return {
    fire(credential) {
      if (callback) callback({ credential: credential ?? undefined });
    }
  };
}

function App({ captureAuth }: { captureAuth?: (auth: AuthContextValue) => void }) {
  const auth = useAuth();
  if (captureAuth) captureAuth(auth);
  return (
    <div>
      <span data-testid="status">{auth.status}</span>
      <span data-testid="user">{auth.user ? auth.user.displayName : ""}</span>
      <span data-testid="credential-exp">{auth.credentialExpiresAt ?? ""}</span>
      <button type="button" onClick={() => auth.requireValidCredential().catch(() => undefined)}>require</button>
      <button type="button" onClick={() => auth.signOut()}>signout</button>
    </div>
  );
}

function renderApp(captureAuth?: (auth: AuthContextValue) => void) {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <AuthProvider clientId={clientId}>
        <Routes>
          <Route path="/" element={<App captureAuth={captureAuth} />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    window.sessionStorage.clear();
    mockFetch.mockReset();
    installFakeGIS();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("starts as reauthRequired when a display name is persisted", async () => {
    window.sessionStorage.setItem("songbook:display-user", JSON.stringify({ email: "marie@example.com", displayName: "마리" }));
    renderApp();
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("reauthRequired"));
    expect(screen.getByTestId("user").textContent).toBe("");
  });

  it("uses a fresh credential returned by GIS login and exposes role/expiresAt", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: { email: "marie@example.com", displayName: "마리", role: "owner" } })
    });
    const gis = installFakeGIS();
    let captured: AuthContextValue | null = null;
    renderApp((auth) => {
      captured = auth;
    });
    const token = encodeToken(tokenClaims.valid);
    await act(async () => {
      const promise = captured!.requireValidCredential();
      // Simulate the GIS prompt callback firing shortly after.
      await new Promise((resolve) => window.setTimeout(resolve, 0));
      gis.fire(token);
      await promise;
    });
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("authenticated"));
    expect(screen.getByTestId("user").textContent).toBe("마리");
    expect(Number(screen.getByTestId("credential-exp").textContent)).toBeGreaterThan(Date.now());
  });

  it("rejects expired credentials and forces a reauth", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: { email: "marie@example.com", displayName: "마리", role: "owner" } })
    });
    let captured: AuthContextValue | null = null;
    renderApp((auth) => {
      captured = auth;
    });
    const expired = encodeToken(tokenClaims.expired);
    await act(async () => {
      try {
        await captured!.loginWithCredential(expired);
      } catch {
        /* expected */
      }
    });
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("reauthRequired"));
  });

  it("drops the credential when the server returns UNAUTHORIZED", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: false, error: { code: "UNAUTHORIZED", message: "로그인이 필요해." } })
    });
    let captured: AuthContextValue | null = null;
    renderApp((auth) => {
      captured = auth;
    });
    await act(async () => {
      try {
        await captured!.loginWithCredential(encodeToken(tokenClaims.valid));
      } catch {
        /* expected */
      }
    });
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("reauthRequired"));
  });

  it("exposes AuthRequiredError for callers that miss a credential", async () => {
    const gis = installFakeGIS();
    let captured: AuthContextValue | null = null;
    renderApp((auth) => {
      captured = auth;
    });
    let thrown: unknown = null;
    await act(async () => {
      const promise = captured!.requireValidCredential().catch((err) => {
        thrown = err;
      });
      await new Promise((resolve) => window.setTimeout(resolve, 0));
      gis.fire(null);
      await promise;
    });
    expect(thrown).toBeInstanceOf(AuthRequiredError);
  });

  it("signOut clears the credential and display info", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: { email: "marie@example.com", displayName: "마리", role: "owner" } })
    });
    let captured: AuthContextValue | null = null;
    renderApp((auth) => {
      captured = auth;
    });
    await act(async () => {
      await captured!.loginWithCredential(encodeToken(tokenClaims.valid));
    });
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("authenticated"));
    await act(async () => {
      await captured!.signOut();
    });
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("anonymous"));
    expect(window.sessionStorage.getItem("songbook:display-user")).toBeNull();
  });

  it("isApiAuthError detects UNAUTHORIZED codes", () => {
    const err = new Error("x") as Error & { code?: string };
    err.code = "UNAUTHORIZED";
    expect(isApiAuthError(err)).toBe(true);
    const err2 = new Error("x") as Error & { code?: string };
    err2.code = "FORBIDDEN";
    expect(isApiAuthError(err2)).toBe(true);
    const err3 = new Error("x") as Error & { code?: string };
    err3.code = "INTERNAL_ERROR";
    expect(isApiAuthError(err3)).toBe(false);
    expect(isApiAuthError("UNAUTHORIZED")).toBe(false);
    expect(isApiAuthError(null)).toBe(false);
  });
});
