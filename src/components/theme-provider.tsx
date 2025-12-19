
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // The provider no longer needs the full list of themes.
  // It will only manage "light", "dark", and "system".
  // The color theme class will be managed by the useTheme hook.
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
