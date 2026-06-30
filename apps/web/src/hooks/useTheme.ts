import { useEffect, useState } from "react";

export type ThemeMode = "system" | "light" | "dark";

export function useTheme(): [ThemeMode, (theme: ThemeMode) => void] {
  const [theme, setTheme] = useState<ThemeMode>(() => (window.localStorage.getItem("songbook:theme") as ThemeMode | null) ?? "system");

  useEffect(() => {
    window.localStorage.setItem("songbook:theme", theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return [theme, setTheme];
}
