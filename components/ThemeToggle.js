"use client";

import { useEffect, useState } from "react";
import { Moon, MoonIcon, SunMediumIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { updatePreference } from "@/lib/actions/settings";

export default function ThemeToggle({ compact = false }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Server-rendered markup can't know the class the blocking theme
    // script already applied client-side, so sync after mount instead of
    // reading `document` in the initializer (which would mismatch SSR).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle(next) {
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
    updatePreference("darkMode", next).catch(() => {});
  }

  const switchEl = (
    <Switch
      checked={dark}
      onCheckedChange={toggle}
      aria-label="Toggle dark mode"
      icon={
        dark ? (
          <MoonIcon size={11} className="text-primary" />
        ) : (
          <SunMediumIcon size={11} className="text-warning" />
        )
      }
    />
  );

  if (compact) {
    return switchEl;
  }

  return (
    <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-background hover:text-foreground">
      <Moon size={18} />
      <span className="flex-1 text-left">Dark Mode</span>
      {switchEl}
    </label>
  );
}
