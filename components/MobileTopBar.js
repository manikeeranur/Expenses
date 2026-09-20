"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import MobileNavDrawer from "@/components/MobileNavDrawer";
import { PAGES } from "@/components/DesktopTopBar";

export default function MobileTopBar({ unreadCount }) {
  const pathname = usePathname();
  if (!PAGES[pathname]) return null;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
      <MobileNavDrawer />
      <span className="text-sm font-bold">Monthly Expenses</span>
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
    </header>
  );
}
