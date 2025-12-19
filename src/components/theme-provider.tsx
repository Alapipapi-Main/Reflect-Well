"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

const THEMES = ["light", "dark", "system", "theme-default", "theme-forest", "theme-ocean", "theme-rose"];

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props} themes={THEMES}>{children}</NextThemesProvider>
}
