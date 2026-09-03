import { createContext, useContext } from "react";

interface ThemeContextValue {
  theme: "light" | "dark" | "system";
  setTheme: (t: "light" | "dark" | "system") => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ theme, setTheme, children }: ThemeContextValue & { children: React.ReactNode }) {
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: "system" as const, setTheme: () => {} };
  return ctx;
}