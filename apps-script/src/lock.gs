// Server-side mutex helper. Standalone web apps (no bound Sheet) cannot use
// LockService.getDocumentLock(), so the script-level lock is the only safe
// option. The lock is always released in `finally`.

function withScriptLock(callback) {
  const lock = LockService.getScriptLock();
  if (!lock) {
    throw publicError("LOCK_UNAVAILABLE", "서버 잠금을 사용할 수 없어.");
  }
  lock.waitLock(30000);
  try {
    return callback();
  } finally {
    try {
      lock.releaseLock();
    } catch (releaseError) {
      // Lock auto-expires after waitLock timeout, so a release failure is
      // not fatal for the caller. Log it so the next request still works.
      console.error(JSON.stringify({
        level: "warn",
        step: "lock release failed",
        message: String(releaseError && releaseError.message || releaseError)
      }));
    }
  }
}
