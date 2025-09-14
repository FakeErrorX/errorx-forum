"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Icon } from '@iconify/react'

import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const toggleTheme = () => {
    // If current theme is system, start with light
    // Otherwise toggle between light and dark
    if (theme === "system") {
      setTheme("light")
    } else {
      setTheme(theme === "light" ? "dark" : "light")
    }
  }

  // Use resolvedTheme to show the correct icon based on actual theme being used
  const isDark = resolvedTheme === "dark"

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      <Icon 
        icon="solar:sun-bold" 
        className={`h-[1.2rem] w-[1.2rem] transition-all ${isDark ? 'scale-100 rotate-0' : 'scale-0 rotate-90'}`} 
      />
      <Icon 
        icon="solar:moon-bold" 
        className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${isDark ? 'scale-0 -rotate-90' : 'scale-100 rotate-0'}`} 
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
