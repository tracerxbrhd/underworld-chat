import { Navigate, Route, Routes } from "react-router-dom";

import { LandingPage } from "../pages/LandingPage";
import { WorkspacePage } from "../pages/WorkspacePage";
import { useI18n, useLanguageSync } from "../shared/i18n";
import { useSessionStore } from "../shared/session-store";

export function App() {
  useLanguageSync();

  const { copy } = useI18n();
  const status = useSessionStore((state) => state.status);
  const accessToken = useSessionStore((state) => state.accessToken);
  const isAuthenticated = status === "authenticated" && Boolean(accessToken);

  return (
    <div className="app-root" aria-label={copy.common.appName}>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate replace to="/app" /> : <LandingPage />} />
        <Route path="/app" element={isAuthenticated ? <WorkspacePage /> : <Navigate replace to="/" />} />
        <Route path="*" element={<Navigate replace to={isAuthenticated ? "/app" : "/"} />} />
      </Routes>
    </div>
  );
}
