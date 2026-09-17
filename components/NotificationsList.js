"use client";

import { useState } from "react";
import { getIcon } from "@/lib/icons";
import { formatDateShort } from "@/lib/format";
import { markNotificationRead } from "@/lib/actions/notifications";

const typeIcon = {
  alert: "AlertTriangle",
  bill: "Receipt",
  report: "FileText",
  large: "TrendingUp",
};

const typeTone = {
  alert: "bg-danger-light text-danger",
  bill: "bg-warning-light text-warning",
  report: "bg-primary-light text-primary",
  large: "bg-success-light text-success",
};

export default function NotificationsList({ notifications }) {
  const [tab, setTab] = useState("all");
  const unreadCount = notifications.filter((n) => !n.read).length;
  const visible = tab === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="space-y-4 px-4 pt-3">
      <div className="flex rounded-2xl bg-surface p-1 shadow-sm shadow-black/[0.03]">
        <button
          type="button"
          onClick={() => setTab("all")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
            tab === "all" ? "bg-primary-light text-primary-dark" : "text-muted"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setTab("unread")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
            tab === "unread" ? "bg-primary-light text-primary-dark" : "text-muted"
          }`}
        >
          Unread{unreadCount > 0 ? ` (${unreadCount})` : ""}
        </button>
      </div>

      {visible.length ? (
        visible.map((n) => {
          const Icon = getIcon(typeIcon[n.type] || "Bell");
          const markRead = markNotificationRead.bind(null, n._id);
          return (
            <form key={n._id} action={n.read ? undefined : markRead}>
              <button
                type="submit"
                disabled={n.read}
                className="flex w-full items-start gap-3 rounded-2xl bg-surface p-3.5 text-left shadow-sm shadow-black/[0.03]"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${typeTone[n.type] || typeTone.alert}`}>
                  <Icon size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{n.title}</p>
                    {!n.read ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> : null}
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{n.message}</p>
                  <p className="mt-1 text-[11px] text-muted">{formatDateShort(n.createdAt)}</p>
                </div>
              </button>
            </form>
          );
        })
      ) : (
        <p className="rounded-2xl bg-surface p-6 text-center text-xs text-muted shadow-sm shadow-black/[0.03]">
          {tab === "unread" ? "No unread notifications." : "No notifications."}
        </p>
      )}
    </div>
  );
}
