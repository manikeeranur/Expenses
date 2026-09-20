"use client";

import { createPortal } from "react-dom";
import { useMounted } from "@/lib/useMounted";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  onCancel,
  onConfirm,
}) {
  const mounted = useMounted();
  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div className="w-full max-w-xs rounded-3xl bg-surface p-5 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-semibold">{title}</p>
        {description ? <p className="mt-1.5 text-xs text-muted">{description}</p> : null}
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-danger py-2.5 text-sm font-semibold text-white"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
