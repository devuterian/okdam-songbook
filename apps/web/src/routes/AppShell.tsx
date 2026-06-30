import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

export function AppShell() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    const onUpdate = () => setUpdateReady(true);
    window.addEventListener("songbook:update-ready", onUpdate);
    return () => window.removeEventListener("songbook:update-ready", onUpdate);
  }, []);

  return (
    <>
      <Outlet />
      {updateReady ? (
        <div className="update-toast" role="status">
          새 버전이 있어.
          <button type="button" onClick={() => window.location.reload()}>
            업데이트
          </button>
        </div>
      ) : null}
    </>
  );
}

