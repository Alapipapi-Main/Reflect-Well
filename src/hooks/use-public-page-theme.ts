"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

/**
 * A hook to manage the theme for public-facing pages.
 * It temporarily sets the theme to "light" for the duration the component is mounted,
 * but crucially, it does not restore the original theme on unmount. This prevents
 * overwriting the theme state when a user navigates from a public page (like login)
 * to a private, themed page (like the journal).
 */
export function usePublicPageTheme() {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme("light");
    // By not including a cleanup function that restores the theme, we avoid
    // a race condition where the login page would try to set the theme back
    // at the same time the journal page is trying to load its correct theme.
  }, [setTheme]);
}
