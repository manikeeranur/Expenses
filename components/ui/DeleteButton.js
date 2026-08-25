"use client";

import { X } from "lucide-react";

export default function DeleteButton({ action, label = "Delete", confirmText = "Delete this?", variant = "icon" }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
      className={variant === "block" ? "w-full" : undefined}
    >
      {variant === "block" ? (
        <button
          type="submit"
          className="w-full rounded-2xl border border-danger/30 bg-danger-light py-3 text-sm font-semibold text-danger"
        >
          {label}
        </button>
      ) : (
        <button
          type="submit"
          aria-label={label}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-danger-light hover:text-danger"
        >
          <X size={14} />
        </button>
      )}
    </form>
  );
}
