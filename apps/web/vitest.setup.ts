import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";

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
