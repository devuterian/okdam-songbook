import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { vi } from "vitest";

// Force the real API path in tests. AuthContext expects a live fetch surface
// so it can assert UNAUTHORIZED / network behavior. Override per-test with
// `vi.stubEnv` if you need the mock branch.
vi.stubEnv("VITE_ENABLE_MOCK_API", "false");
vi.stubEnv("VITE_APPS_SCRIPT_API_URL", "https://example.test/exec");
vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "test-client-id.apps.googleusercontent.com");

const store = new Map<string, string>();
const storage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, value),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
  key: (index: number) => Array.from(store.keys())[index] ?? null,
  get length() {
    return store.size;
  }
};

Object.defineProperty(window, "localStorage", {
  value: storage,
  configurable: true
});

Object.defineProperty(window, "requestAnimationFrame", {
  value: (callback: FrameRequestCallback) => window.setTimeout(() => callback(Date.now()), 16),
  configurable: true
});

Object.defineProperty(window, "cancelAnimationFrame", {
  value: (handle: number) => window.clearTimeout(handle),
  configurable: true
});
