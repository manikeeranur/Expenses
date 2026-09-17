"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Bell } from "lucide-react";
import UserMenu from "@/components/UserMenu";

const PAGES = {
  "/dashboard": { title: "Dashboard", subtitle: "Overview of your monthly expenses" },
  "/transactions": { title: "Transactions", subtitle: "View and manage all your transactions" },
  "/categories": { title: "Categories", subtitle: "Track spending by category" },
  "/budgets": { title: "Budgets", subtitle: "Monitor your monthly budgets" },
  "/reports": { title: "Reports", subtitle: "Analyze your financial trends" },
  "/goals": { title: "Goals", subtitle: "Track progress toward your savings goals" },
  "/lending": { title: "Lending", subtitle: "Track money you've lent out" },
  "/accounts": { title: "Accounts", subtitle: "Manage your linked and manual accounts" },
  "/pay": { title: "UPI Pay", subtitle: "Send and receive money via UPI" },
  "/calendar": { title: "Calendar", subtitle: "View transactions by date" },
  "/insights": { title: "Insights", subtitle: "Personalized observations on your spending" },
  "/notifications": { title: "Notifications", subtitle: "Stay updated on your finances" },
  "/settings": { title: "Settings", subtitle: "Manage your preferences" },
  "/profile": { title: "Profile", subtitle: "Manage your account" },
  "/export": { title: "Export Report", subtitle: "Download your financial reports" },
};

export default function DesktopTopBar({ user, unreadCount }) {
  const pathname = usePathname();
  const page = PAGES[pathname];
  if (!page) return null;

  const monthLabel = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <header className="sticky top-0 z-20 hidden items-center justify-between border-b border-border bg-background/95 px-8 py-5 backdrop-blur md:flex">
      <div>
        <h1 className="text-2xl font-bold">{page.title}</h1>
        <p className="mt-0.5 text-sm text-muted">{page.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium">
          <Calendar size={15} className="text-muted" />
          {monthLabel}
        </span>

        <Link
          href="/notifications"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface"
        >
          <Bell size={16} />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
              {unreadCount}
            </span>
          ) : null}
        </Link>

        <UserMenu user={user} />
      </div>
    </header>
  );
}
