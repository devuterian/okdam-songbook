import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

type UpdateServiceWorker = (reloadPage?: boolean) => Promise<void>;
type SongbookUpdateEvent = {
  detail?: UpdateServiceWorker;
};

export function AppShell() {
  const [updateReady, setUpdateReady] = useState(false);
  const [updateServiceWorker, setUpdateServiceWorker] = useState<UpdateServiceWorker | null>(null);

  useEffect(() => {
    const onUpdate = (event: unknown) => {
      setUpdateReady(true);
      const updater = (event as SongbookUpdateEvent).detail;
      if (updater) setUpdateServiceWorker(() => updater);
    };
    window.addEventListener("songbook:update-ready", onUpdate);
    return () => window.removeEventListener("songbook:update-ready", onUpdate);
  }, []);

  function applyUpdate() {
    if (updateServiceWorker) void updateServiceWorker(true);
    else window.location.reload();
  }

  return (
    <>
      <Outlet />
      {updateReady ? (
        <div className="update-toast" role="status">
          새 버전이 있어.
          <button type="button" onClick={applyUpdate}>
            업데이트
          </button>
        </div>
      ) : null}
    </>
  );
}
