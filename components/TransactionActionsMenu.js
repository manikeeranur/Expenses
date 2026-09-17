"use client";

import { useState } from "react";
import { MoreVertical, Trash2 } from "lucide-react";

export default function TransactionActionsMenu({ editSlot, deleteAction }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="More actions"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-background"
      >
        <MoreVertical size={16} />
      </button>

      {open ? <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} /> : null}

      <div
        className={`absolute right-0 top-9 z-50 w-52 rounded-2xl border border-border bg-surface p-1.5 shadow-xl shadow-black/10 ${open ? "" : "hidden"}`}
      >
        <div onClick={() => setOpen(false)}>{editSlot}</div>

        <form
          action={deleteAction}
          onSubmit={(e) => {
            if (!confirm("Delete this transaction?")) {
              e.preventDefault();
              return;
            }
            setOpen(false);
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-danger hover:bg-danger-light"
          >
            <Trash2 size={15} className="shrink-0" />
            Delete Transaction
          </button>
        </form>
      </div>
    </div>
  );
}
