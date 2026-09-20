"use client";

import { useRef, useState } from "react";
import { X, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function DeleteButton({
  action,
  label = "Delete",
  confirmText = "Delete this?",
  variant = "icon",
  description,
}) {
  const formRef = useRef(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <form action={action} ref={formRef} className={variant === "block" || variant === "card" ? "w-full" : undefined}>
        {variant === "block" ? (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="w-full rounded-2xl border border-danger/30 bg-danger-light py-3 text-sm font-semibold text-danger"
          >
            {label}
          </button>
        ) : variant === "outline" ? (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            aria-label={label}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-danger/30 text-danger transition-colors hover:bg-danger-light"
          >
            <Trash2 size={14} />
          </button>
        ) : variant === "card" ? (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
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
            type="button"
            onClick={() => setConfirmOpen(true)}
            aria-label={label}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-danger-light hover:text-danger"
          >
            <X size={14} />
          </button>
        )}
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title={confirmText}
        confirmLabel={label}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          formRef.current?.requestSubmit();
        }}
      />
    </>
  );
}
