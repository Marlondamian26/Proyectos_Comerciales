"use client";

import { createContext, useContext, useEffect, useCallback, useMemo, useSyncExternalStore, type ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "mi-pyme-theme";
const THEME_COOKIE_KEY = "mi-pyme-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
    return null;
  } catch {
    return null;
  }
}

function readCookieTheme(): ThemeMode | null {
  if (typeof document === "undefined") return null;

  try {
    const cookies = document.cookie.split("; ").reduce((acc, cookie) => {
      const [key, value] = cookie.split("=");
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const stored = cookies[THEME_COOKIE_KEY];
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
    return null;
  } catch {
    return null;
  }
}

function persistTheme(theme: ThemeMode) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);

    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `${THEME_COOKIE_KEY}=${theme}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  } catch {
    return;
  }
}

function applyTheme(theme: "light" | "dark") {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
}

function resolveTheme(theme: ThemeMode, systemTheme: "light" | "dark"): "light" | "dark" {
  if (theme === "system") return systemTheme;
  return theme;
}

interface ThemeStore {
  theme: ThemeMode;
  systemTheme: "light" | "dark";
  resolvedTheme: "light" | "dark";
  ready: boolean;
  listeners: Set<() => void>;
}

const themeStore: ThemeStore = {
  theme: "system",
  systemTheme: "light",
  resolvedTheme: "light",
  ready: typeof window !== "undefined",
  listeners: new Set(),
};

function subscribe(listener: () => void) {
  themeStore.listeners.add(listener);

  return () => {
    themeStore.listeners.delete(listener);
  };
}

function emitChange() {
  themeStore.listeners.forEach((listener) => listener());
}

function getThemeSnapshot() {
  return themeStore.theme;
}

function getResolvedThemeSnapshot() {
  return resolveTheme(themeStore.theme, themeStore.systemTheme);
}

function getReadySnapshot() {
  return themeStore.ready;
}

function setTheme(theme: ThemeMode) {
  themeStore.theme = theme;
  const resolved = resolveTheme(theme, themeStore.systemTheme);
  themeStore.resolvedTheme = resolved;
  persistTheme(theme);
  applyTheme(resolved);
  emitChange();
}

function updateSystemTheme() {
  const newSystemTheme = getSystemTheme();
  themeStore.systemTheme = newSystemTheme;

  if (themeStore.theme === "system") {
    const resolved = newSystemTheme;
    themeStore.resolvedTheme = resolved;
    applyTheme(resolved);
  }

  emitChange();
}

function initializeTheme() {
  if (typeof window === "undefined") return;

  const stored = readStoredTheme() ?? readCookieTheme() ?? "system";
  themeStore.theme = stored;
  themeStore.systemTheme = getSystemTheme();
  themeStore.ready = true;

  const resolved = resolveTheme(stored, themeStore.systemTheme);
  themeStore.resolvedTheme = resolved;
  applyTheme(resolved);
  emitChange();
}

if (typeof window !== "undefined") {
  initializeTheme();
}

type ThemeContextValue = {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  ready: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, () => "system" as ThemeMode);
  const resolvedTheme = useSyncExternalStore(subscribe, getResolvedThemeSnapshot, () => "light" as "light" | "dark");
  const ready = useSyncExternalStore(subscribe, getReadySnapshot, () => false);

  useEffect(() => {
    initializeTheme();
  }, []);

  useEffect(() => {
    if (!ready) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => updateSystemTheme();

    mediaQuery.addEventListener("change", handleChange);
    applyTheme(resolvedTheme);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [ready, resolvedTheme]);

  const handleSetTheme = useCallback((nextTheme: ThemeMode) => {
    setTheme(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const current = themeStore.resolvedTheme === "dark" ? "light" : "dark";
    setTheme(current);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      ready,
      setTheme: handleSetTheme,
      toggleTheme,
    }),
    [theme, resolvedTheme, ready, handleSetTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}

export function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    if (typeof document === "undefined") return "light";

    try {
      const cookies = document.cookie.split("; ").reduce((acc, cookie) => {
        const [key, value] = cookie.split("=");
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      const stored = cookies[THEME_COOKIE_KEY];
      if (stored === "light" || stored === "dark") return stored;
      if (stored === "system") return getSystemTheme();
    } catch {
      return "light";
    }

    return "light";
  }

  const stored = readStoredTheme() ?? readCookieTheme() ?? "system";
  return resolveTheme(stored, getSystemTheme());
}