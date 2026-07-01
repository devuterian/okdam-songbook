// Google Identity Services is loaded exactly once and shared across the app.
// Multiple <script> insertions or duplicate `initialize()` calls were a
// production source of stale credentials. Callers should use `getGoogleAccounts()`
// to read the singleton.

type GoogleCredentialResponse = { credential?: string };

type GoogleAccountsId = {
  initialize(options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: { theme?: "outline" | "filled_blue" | "filled_black"; size?: "large" | "medium" | "small"; type?: "standard" | "icon"; shape?: "rectangular" | "pill" | "circle"; text?: "signin_with" | "signup_with" | "continue_with" | "signin"; width?: number }
  ): void;
  prompt?(callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean; isDismissedMoment: () => boolean }) => void): void;
};

type GoogleAccounts = { id: GoogleAccountsId };

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
  }
}

const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let loadPromise: Promise<GoogleAccountsId> | null = null;

export function loadGoogleIdentityScript(): Promise<GoogleAccountsId> {
  if (typeof window === "undefined") return Promise.reject(new Error("Google 로그인 스크립트는 브라우저에서만 불러올 수 있어."));
  if (window.google?.accounts.id) return Promise.resolve(window.google.accounts.id);

  if (!loadPromise) {
    loadPromise = new Promise<GoogleAccountsId>((resolve, reject) => {
      const existing = Array.from(document.scripts).find((script) => script.src === GIS_SCRIPT_SRC);
      const handleLoad = () => {
        if (window.google?.accounts.id) resolve(window.google.accounts.id);
        else reject(new Error("Google 로그인 스크립트를 불러왔지만 초기화되지 않았어."));
      };
      if (existing) {
        existing.addEventListener("load", handleLoad, { once: true });
        existing.addEventListener("error", () => reject(new Error("Google 로그인 스크립트를 불러오지 못했어.")), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = GIS_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", handleLoad, { once: true });
      script.addEventListener("error", () => reject(new Error("Google 로그인 스크립트를 불러오지 못했어.")), { once: true });
      document.head.append(script);
    });
  }
  return loadPromise;
}

export function isGoogleAccountsReady(): boolean {
  return Boolean(window.google?.accounts.id);
}
