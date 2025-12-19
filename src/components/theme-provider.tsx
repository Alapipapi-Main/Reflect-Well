
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from "@/firebase"
import { doc } from "firebase/firestore"
import type { UserSettings } from "@/lib/types"

// This is the provider component that wraps the app in journal/page.tsx
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  // Memoize the doc reference
  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'settings', 'main');
  }, [user, firestore]);
  
  // Fetch settings from Firestore
  const { data: settings } = useDoc<UserSettings>(settingsDocRef);
  
  // Get the setter from next-themes
  const { setTheme: setNextTheme } = useNextTheme();

  // Effect to sync Firestore setting to next-themes
  React.useEffect(() => {
    if (settings?.appearance) {
      setNextTheme(settings.appearance);
    }
  }, [settings?.appearance, setNextTheme]);

  // Callback to update Firestore when theme changes
  const handleThemeChange = (theme: string) => {
    if (settingsDocRef) {
      setDocumentNonBlocking(settingsDocRef, { appearance: theme }, { merge: true });
    }
  };

  return (
    <NextThemesProvider 
      {...props}
      onThemeChange={handleThemeChange} // Custom callback
    >
      {children}
    </NextThemesProvider>
  )
}
