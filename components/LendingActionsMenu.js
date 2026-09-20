"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Check, Trash2 } from "lucide-react";
import { useMounted } from "@/lib/useMounted";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// The panel stays mounted (just hidden) so that modals opened from a menu item
// survive the menu closing — they're rendered by these children. It's portaled
// to <body> and positioned with fixed coords so it never gets clipped by an
// ancestor's overflow (e.g. the table's horizontal-scroll wrapper).
export default function LendingActionsMenu({ editSlot, reminderSlot, isClosed, statusAction, deleteAction }) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const mounted = useMounted();
  const [coords, setCoords] = useState(null);
  const buttonRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  function handleToggle() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const panelHeight = 230;
      const openUpward = window.innerHeight - rect.bottom < panelHeight + 16;
      setCoords({
        top: openUpward ? Math.max(8, rect.top - panelHeight - 4) : rect.bottom + 4,
        left: Math.max(8, rect.right - 256),
      });
    }
    setOpen((v) => !v);
  }

  const panel = (
    <>
      <div className={`fixed inset-0 z-40 ${open ? "" : "hidden"}`} onClick={() => setOpen(false)} />
      <div
        style={coords || undefined}
        className={`fixed z-50 w-64 rounded-2xl border border-border bg-surface p-1.5 shadow-xl shadow-black/10 ${open ? "" : "hidden"}`}
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

        <form action={deleteAction} ref={formRef}>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setConfirmOpen(true);
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-danger hover:bg-danger-light"
          >
            <Trash2 size={15} className="shrink-0" />
            Delete Entry
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        aria-label="More actions"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-surface shadow-sm shadow-black/5"
      >
        <MoreVertical size={18} />
      </button>

      {mounted ? createPortal(panel, document.body) : null}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this lending entry?"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          formRef.current?.requestSubmit();
        }}
      />
    </div>
  );
}
