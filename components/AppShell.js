"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import DesktopTopBar from "@/components/DesktopTopBar";
import MobileTopBar from "@/components/MobileTopBar";

const NO_SHELL_ROUTES = new Set(["/", "/login", "/signup", "/maintenance"]);

export default function AppShell({ user, unreadCount, children }) {
  const pathname = usePathname();

  if (NO_SHELL_ROUTES.has(pathname)) {
    return children;
  }

  return (
    <div className="md:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <DesktopTopBar user={user} unreadCount={unreadCount} />
        <MobileTopBar unreadCount={unreadCount} />
        {children}
      </div>
    </div>
  );
}
