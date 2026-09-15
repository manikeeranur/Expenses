"use client";

import { X, Trash2 } from "lucide-react";

export default function DeleteButton({
  action,
  label = "Delete",
  confirmText = "Delete this?",
  variant = "icon",
  description,
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
      className={variant === "block" || variant === "card" ? "w-full" : undefined}
    >
      {variant === "block" ? (
        <button
          type="submit"
          className="w-full rounded-2xl border border-danger/30 bg-danger-light py-3 text-sm font-semibold text-danger"
        >
          {label}
        </button>
      ) : variant === "outline" ? (
        <button
          type="submit"
          aria-label={label}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-danger/30 text-danger transition-colors hover:bg-danger-light"
        >
          <Trash2 size={14} />
        </button>
      ) : variant === "card" ? (
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-2xl border border-danger/30 bg-danger-light p-4 text-left"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger/15 text-danger">
            <Trash2 size={18} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-danger">{label}</span>
            {description ? <span className="block text-xs text-danger/80">{description}</span> : null}
          </span>
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
