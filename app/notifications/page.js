import { Bell } from "lucide-react";
import { getIcon } from "@/lib/icons";
import { formatDateShort } from "@/lib/format";
import Screen from "@/components/Screen";
import BottomNav from "@/components/BottomNav";
import MarkAllReadButton from "@/components/MarkAllReadButton";
import { requireUserId } from "@/lib/session";
import { getNotifications } from "@/lib/data";
import { markNotificationRead } from "@/lib/actions/notifications";

const typeIcon = {
  alert: "AlertTriangle",
  bill: "Receipt",
  recurring: "Repeat",
  report: "FileText",
  large: "TrendingUp",
};

const typeTone = {
  alert: "bg-danger-light text-danger",
  bill: "bg-warning-light text-warning",
  recurring: "bg-info-light text-info",
  report: "bg-primary-light text-primary",
  large: "bg-success-light text-success",
};

export default async function NotificationsPage() {
  const userId = await requireUserId();
  const notifications = await getNotifications(userId);
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <Screen wide>
      <header className="flex items-center justify-between px-4 pb-2 pt-6 md:hidden">
        <h1 className="text-xl font-bold">Notifications</h1>
        {hasUnread ? <MarkAllReadButton /> : null}
      </header>

      {notifications.length ? (
        <div className="space-y-4 px-4 pt-3">
          {notifications.map((n) => {
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
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center px-8 pt-24 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-light">
            <Bell size={40} className="text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="mt-6 text-lg font-bold">No Notifications</h2>
          <p className="mt-1 text-sm text-muted">You&apos;re all caught up.</p>
        </div>
      )}

      <BottomNav />
    </Screen>
  );
}
