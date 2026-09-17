"use client";

import { useTransition } from "react";
import { updatePreference } from "@/lib/actions/settings";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function PreferenceSelect({ prefKey, defaultValue, options }) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      defaultValue={defaultValue}
      disabled={pending}
      onValueChange={(value) => startTransition(() => updatePreference(prefKey, value))}
    >
      <SelectTrigger variant="bare" className="w-auto justify-end gap-1.5 text-sm text-muted disabled:opacity-60">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
