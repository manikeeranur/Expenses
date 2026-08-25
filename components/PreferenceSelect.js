"use client";

import { useTransition } from "react";
import { updatePreference } from "@/lib/actions/settings";

export default function PreferenceSelect({ prefKey, defaultValue, options }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={defaultValue}
      disabled={pending}
      onChange={(e) => startTransition(() => updatePreference(prefKey, e.target.value))}
      className="bg-transparent text-right text-sm text-muted outline-none disabled:opacity-60"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
