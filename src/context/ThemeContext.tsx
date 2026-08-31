"use client";

import {
  ThemeProvider as NextThemesProvider,
  useTheme as useNextTheme,
} from "next-themes";
import { useEffect, useState, type ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="crediple-cms-theme"
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}

export function ThemeScript() {
  const code = `
(function(){
  try {
    var stored = localStorage.getItem('crediple-cms-theme');
    var theme = (stored === 'light' || stored === 'dark') ? stored : 'light';
    document.documentElement.classList.remove('dark','light');
    document.documentElement.classList.add(theme);
  } catch(e){}
})();
`;
  return (
    <script
      dangerouslySetInnerHTML={{ __html: code }}
      suppressHydrationWarning
    />
  );
}

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const current = mounted ? (resolvedTheme ?? theme ?? "light") : "light";

  return {
    theme: current as "dark" | "light",
    isDark: current === "dark",
    toggleTheme: () => setTheme(current === "dark" ? "light" : "dark"),
  };
}
