"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const modes = ["system", "light", "dark"] as const;
const labels = { system: "System", light: "Light", dark: "Dark" } as const;

export function ThemeToggle() {
  const { mode, setMode } = useTheme();

  function cycle() {
    const idx = modes.indexOf(mode);
    setMode(modes[(idx + 1) % modes.length]);
  }

  const Icon = mode === "dark" ? Moon : mode === "light" ? Sun : Monitor;

  return (
    <button
      onClick={cycle}
      className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-300 transition-colors"
      aria-label={`Theme: ${labels[mode]}. Click to change.`}
      title={`Theme: ${labels[mode]}`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
