"use client";

import { useState } from "react";
import { MoreVertical, Check, Trash2 } from "lucide-react";

// The panel stays mounted (just hidden) so that modals opened from a menu item
// survive the menu closing — they're rendered by these children.
export default function LendingActionsMenu({ editSlot, reminderSlot, isClosed, statusAction, deleteAction }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="More actions"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-surface shadow-sm shadow-black/5"
      >
        <MoreVertical size={18} />
      </button>

      {open ? <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} /> : null}

      <div
        className={`absolute right-0 top-11 z-50 w-64 rounded-2xl border border-border bg-surface p-1.5 shadow-xl shadow-black/10 ${open ? "" : "hidden"}`}
      >
        <div onClick={() => setOpen(false)}>{editSlot}</div>
        {reminderSlot}

        <form action={statusAction} onSubmit={() => setOpen(false)}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-background"
          >
            <Check size={15} className="shrink-0 text-muted" />
            {isClosed ? "Reopen Entry" : "Mark as Closed"}
          </button>
        </form>

        <form
          action={deleteAction}
          onSubmit={(e) => {
            if (!confirm("Delete this lending entry?")) {
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
            Delete Entry
          </button>
        </form>
      </div>
    </div>
  );
}
