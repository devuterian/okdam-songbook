import { describe, expect, it, vi } from "vitest";

// Mirror of apps-script/src/lock.gs. Kept in lock-step manually; if either
// changes, update both. Tested here so we can assert the contract without
// pulling in the Apps Script runtime.

type LockStub = { waitLock: (ms?: number) => void; releaseLock: () => void };

interface LockServiceLike {
  getScriptLock: () => LockStub | null;
  getDocumentLock: () => LockStub | null;
}

function withScriptLock(callback: () => unknown, lockService: LockServiceLike): unknown {
  const lock = lockService.getScriptLock();
  if (!lock) {
    const err = new Error("서버 잠금을 사용할 수 없어.") as Error & { code: string };
    err.code = "LOCK_UNAVAILABLE";
    throw err;
  }
  lock.waitLock(30000);
  try {
    return callback();
  } finally {
    try {
      lock.releaseLock();
    } catch {
      // swallow; lock auto-expires
    }
  }
}

function makeLock(overrides: Partial<LockStub> = {}): LockStub & { calls: { wait: number; release: number } } {
  const calls = { wait: 0, release: 0 };
  return {
    waitLock: vi.fn(() => {
      calls.wait += 1;
    }),
    releaseLock: vi.fn(() => {
      calls.release += 1;
    }),
    ...overrides,
    calls
  };
}

describe("withScriptLock", () => {
  it("standalone env where document lock is null still acquires script lock", () => {
    const lock = makeLock();
    const lockService: LockServiceLike = {
      getScriptLock: () => lock,
      getDocumentLock: () => null
    };
    const result = withScriptLock(() => "ok", lockService);
    expect(result).toBe("ok");
    expect(lock.calls.wait).toBe(1);
    expect(lock.calls.release).toBe(1);
  });

  it("uses LockService.getScriptLock (not getDocumentLock)", () => {
    const scriptLock = makeLock();
    const documentLock = makeLock();
    const lockService: LockServiceLike = {
      getScriptLock: vi.fn(() => scriptLock),
      getDocumentLock: vi.fn(() => documentLock)
    };
    withScriptLock(() => null, lockService);
    expect((lockService.getScriptLock as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
    expect((lockService.getDocumentLock as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);
    expect(documentLock.calls.wait).toBe(0);
    expect(documentLock.calls.release).toBe(0);
  });

  it("releases the lock after the callback returns successfully", () => {
    const lock = makeLock();
    const lockService: LockServiceLike = { getScriptLock: () => lock, getDocumentLock: () => null };
    withScriptLock(() => 42, lockService);
    expect(lock.calls.release).toBe(1);
  });

  it("releases the lock even when the callback throws", () => {
    const lock = makeLock();
    const lockService: LockServiceLike = { getScriptLock: () => lock, getDocumentLock: () => null };
    expect(() =>
      withScriptLock(() => {
        throw new Error("boom");
      }, lockService)
    ).toThrow("boom");
    expect(lock.calls.release).toBe(1);
  });

  it("swallows a release failure but still rethrows the original callback error", () => {
    const lock = makeLock({
      releaseLock: () => {
        throw new Error("release failed");
      }
    });
    const lockService: LockServiceLike = { getScriptLock: () => lock, getDocumentLock: () => null };
    expect(() =>
      withScriptLock(() => {
        throw new Error("inner boom");
      }, lockService)
    ).toThrow("inner boom");
  });

  it("throws LOCK_UNAVAILABLE when the script lock is null", () => {
    const lockService: LockServiceLike = { getScriptLock: () => null, getDocumentLock: () => null };
    expect(() => withScriptLock(() => null, lockService)).toThrowError(
      expect.objectContaining({ code: "LOCK_UNAVAILABLE" })
    );
  });

  it("returns the callback's return value to the caller", () => {
    const lock = makeLock();
    const lockService: LockServiceLike = { getScriptLock: () => lock, getDocumentLock: () => null };
    const out = withScriptLock(() => ({ inserted: 5, skipped: 0 }), lockService);
    expect(out).toEqual({ inserted: 5, skipped: 0 });
  });
});
