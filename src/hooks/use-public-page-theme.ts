"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

/**
 * A hook to manage the theme for public-facing pages.
 * It temporarily sets the theme to "light" for the duration the component is mounted,
 * and restores the original theme when the component unmounts.
 * This prevents overwriting a user's saved "dark" preference while ensuring
 * public pages always appear in light mode.
 */
export function usePublicPageTheme() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Store the original theme and set the theme to "light" when the component mounts.
    const originalTheme = theme;
    setTheme("light");

    // When the component unmounts (e.g., user navigates away), restore the original theme.
    return () => {
      if (originalTheme) {
        setTheme(originalTheme);
      }
    };
  }, [setTheme]); // Only run this effect once on mount and cleanup on unmount.
}
