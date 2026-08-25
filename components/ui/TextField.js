"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const AUTOCOMPLETE = {
  email: "email",
  name: "name",
  password: "current-password",
};

export default function TextField({ label, type = "text", name, placeholder, defaultValue, required, autoComplete, right }) {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;
  const resolvedAutoComplete = autoComplete || AUTOCOMPLETE[name] || AUTOCOMPLETE[type];

  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={id} className="text-xs font-medium text-muted">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={inputType}
          placeholder={placeholder}
          defaultValue={defaultValue}
          required={required}
          autoComplete={resolvedAutoComplete}
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        ) : (
          right
        )}
      </div>
    </div>
  );
}
