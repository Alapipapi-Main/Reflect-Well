
"use client"

import * as React from "react"
import { Moon, Sun, Palette } from "lucide-react"
import { useTheme as useNextTheme } from "next-themes"
import { useTheme } from "@/hooks/use-theme"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  // `next-themes` is now only for light/dark mode
  const { setTheme: setMode } = useNextTheme()
  // Our new hook manages the color theme class
  const { setTheme: setColorTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setMode("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode("system")}>
          System
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span>Color Theme</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setColorTheme("theme-default")}>
          Default (Rose)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setColorTheme("theme-forest")}>
          Forest
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setColorTheme("theme-ocean")}>
          Ocean
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setColorTheme("theme-rose")}>
          Sakura
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
