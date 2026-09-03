import { useEffect, useState } from "react";
import { settingsService } from "@/engines/settings.service";
import type { AppSettings } from "@/engines/settings.types";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  useEffect(() => {
    settingsService.get().then(setSettings);
  }, []);
  const update = async (changes: Partial<AppSettings>) => {
    const next = await settingsService.update(changes);
    setSettings(next);
  };
  return { settings, update };
}

const THEME_STORAGE_KEY = "tasktracky.theme";

type ThemeMode = "light" | "dark" | "system";

function readStoredTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    // localStorage unavailable
  }
  return "system";
}

function systemPrefersDark(): boolean {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(readStoredTheme);

  useEffect(() => {
    const root = document.documentElement;
    const effective = theme === "system" ? (systemPrefersDark() ? "dark" : "light") : theme;
    root.classList.toggle("dark", effective === "dark");
    if (theme !== "system") return;
    let mq: MediaQueryList;
    try {
      mq = window.matchMedia("(prefers-color-scheme: dark)");
    } catch {
      return;
    }
    const handler = () => root.classList.toggle("dark", mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setAndStore = (t: ThemeMode) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, t);
    } catch {
      // ignore
    }
    setTheme(t);
  };
  return { theme, setTheme: setAndStore };
}