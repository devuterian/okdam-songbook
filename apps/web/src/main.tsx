import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import { AppShell } from "./routes/AppShell";
import { AdminPage } from "./routes/AdminPage";
import { PublicPage } from "./routes/PublicPage";
import "./styles.css";

const basePath = import.meta.env.VITE_APP_BASE_PATH || "/okdam-songbook/";

registerSW({
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent("songbook:update-ready"));
  }
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter basename={basePath.replace(/\/$/, "")}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<PublicPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
