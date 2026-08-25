"use client";

import { useTransition } from "react";
import { markAllNotificationsRead } from "@/lib/actions/notifications";

export default function MarkAllReadButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => markAllNotificationsRead())}
      className="text-xs font-semibold text-primary disabled:opacity-60"
    >
      Mark all as read
    </button>
  );
}
