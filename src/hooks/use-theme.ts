
"use client"

import { useState, useEffect, useCallback } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserSettings } from '@/lib/types';

const COLOR_THEMES = ['theme-default', 'theme-forest', 'theme-ocean', 'theme-rose'];
const THEME_STORAGE_KEY = 'color-theme';
const DEFAULT_THEME = 'theme-default';

export function useTheme() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [theme, setThemeState] = useState<string>(DEFAULT_THEME);

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'settings', 'main');
  }, [user, firestore]);

  const { data: settings } = useDoc<UserSettings>(settingsDocRef);

  // Effect 1: Initialize theme from localStorage or Firestore
  useEffect(() => {
    let initialTheme: string | null = null;
    if (settings?.theme) {
      initialTheme = settings.theme; // Firestore is the source of truth
    } else {
      initialTheme = localStorage.getItem(THEME_STORAGE_KEY); // Fallback to localStorage
    }
    
    if (initialTheme && COLOR_THEMES.includes(initialTheme)) {
      setThemeState(initialTheme);
    } else {
      setThemeState(DEFAULT_THEME);
    }
  }, [settings]);

  // Effect 2: Apply theme class to HTML element
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(...COLOR_THEMES);
    if (theme && COLOR_THEMES.includes(theme)) {
      root.classList.add(theme);
    }
  }, [theme]);

  // Callback to set the theme, which updates state, localStorage, and Firestore
  const setTheme = useCallback((newTheme: string) => {
    if (COLOR_THEMES.includes(newTheme)) {
      // Optimistic updates
      setThemeState(newTheme);
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      
      // Save to Firestore non-blockingly
      if (settingsDocRef) {
        setDocumentNonBlocking(settingsDocRef, { theme: newTheme }, { merge: true });
      }
    }
  }, [settingsDocRef]);

  return { theme, setTheme };
}
