"use client";

import { useState, useTransition } from "react";
import { updatePreference } from "@/lib/actions/settings";

export default function PreferenceSwitch({ prefKey, defaultChecked }) {
  const [checked, setChecked] = useState(defaultChecked);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !checked;
    setChecked(next);
    startTransition(() => updatePreference(prefKey, next));
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={pending}
      onClick={toggle}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${checked ? "bg-primary" : "bg-border"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
