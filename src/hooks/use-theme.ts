
"use client"

import { useState, useEffect, useCallback } from 'react';

const COLOR_THEMES = ['theme-default', 'theme-forest', 'theme-ocean', 'theme-rose'];
const THEME_STORAGE_KEY = 'color-theme';

export function useTheme() {
  // State to hold the current theme, initialized from localStorage or default.
  const [theme, setThemeState] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return 'theme-default';
    }
    return localStorage.getItem(THEME_STORAGE_KEY) || 'theme-default';
  });

  // Effect to apply the theme class to the HTML element whenever the theme changes.
  useEffect(() => {
    const root = window.document.documentElement;

    // Remove any existing color theme classes.
    root.classList.remove(...COLOR_THEMES);

    // Add the new theme class if it's a valid one.
    if (theme && COLOR_THEMES.includes(theme)) {
      root.classList.add(theme);
    }
  }, [theme]); // Rerun this effect if `theme` state changes.

  // Callback to set the theme, which updates both state and localStorage.
  const setTheme = useCallback((newTheme: string) => {
    if (COLOR_THEMES.includes(newTheme)) {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setThemeState(newTheme);
    }
  }, []);

  return { theme, setTheme };
}
