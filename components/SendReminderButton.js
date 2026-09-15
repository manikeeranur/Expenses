"use client";

import { useActionState } from "react";
import { MessageCircle } from "lucide-react";

const STATUS_LABEL = {
  sent: "Reminder sent",
  simulated: "Reminder simulated (no WhatsApp provider yet)",
  failed: "Reminder failed to send",
};

export default function SendReminderButton({ action, lastReminder, variant = "card" }) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const note = state?.error
    ? state.error
    : state?.success
      ? STATUS_LABEL[state.status] || "Reminder logged"
      : lastReminder || "Remind about outstanding amount";

  if (variant === "menu") {
    return (
      <form action={formAction}>
        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-background disabled:opacity-60"
        >
          <MessageCircle size={15} className="shrink-0 text-success" />
          <span className="min-w-0">
            <span className="block">{pending ? "Sending..." : "Send WhatsApp Reminder"}</span>
            <span className={`block text-[11px] ${state?.error ? "text-danger" : "text-muted"}`}>{note}</span>
          </span>
        </button>
      </form>
    );
  }

  return (
    <form action={formAction} className="w-full">
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-left shadow-sm shadow-black/[0.03] disabled:opacity-60"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-light text-success">
          <MessageCircle size={18} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold">
            {pending ? "Sending..." : "Send WhatsApp Reminder"}
          </span>
          <span className={`block text-xs ${state?.error ? "text-danger" : "text-muted"}`}>{note}</span>
        </span>
      </button>
    </form>
  );
}
