import { Bell } from "lucide-react";
import Screen from "@/components/Screen";
import BottomNav from "@/components/BottomNav";
import MarkAllReadButton from "@/components/MarkAllReadButton";
import NotificationsList from "@/components/NotificationsList";
import { requireUserId } from "@/lib/session";
import { getNotifications } from "@/lib/data";

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
        <NotificationsList notifications={notifications} />
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
