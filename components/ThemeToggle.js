"use client";

import { useEffect, useState } from "react";
import { Moon } from "lucide-react";
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

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
    updatePreference("darkMode", next).catch(() => {});
  }

  const switchEl = (
    <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${dark ? "bg-primary" : "bg-border"}`}>
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          dark ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </span>
  );

  if (compact) {
    return (
      <button type="button" onClick={toggle} role="switch" aria-checked={dark} aria-label="Toggle dark mode">
        {switchEl}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={dark}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-background hover:text-foreground"
    >
      <Moon size={18} />
      <span className="flex-1 text-left">Dark Mode</span>
      {switchEl}
    </button>
  );
}
