import Link from "next/link";
import {
  ChevronRight,
  User,
  SlidersHorizontal,
  Download,
  RefreshCw,
  HelpCircle,
  Star,
} from "lucide-react";
import Screen from "@/components/Screen";
import BottomNav from "@/components/BottomNav";
import LogoutButton from "@/components/LogoutButton";
import { requireUserId } from "@/lib/session";
import { getUser } from "@/lib/data";

const menuGroups = [
  {
    items: [
      { icon: User, label: "Personal Information", href: "/settings" },
      { icon: SlidersHorizontal, label: "Preferences", href: "/settings" },
    ],
  },
  {
    items: [
      { icon: Download, label: "Export Data", href: "/export" },
      { icon: RefreshCw, label: "Backup & Restore", href: "/settings" },
    ],
  },
  {
    items: [
      { icon: HelpCircle, label: "Help & Support", href: "/settings" },
      { icon: Star, label: "Rate Our App", href: "/settings" },
    ],
  },
];

export default async function ProfilePage() {
  const userId = await requireUserId();
  const user = await getUser(userId);
  const initial = user?.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <Screen wide>
      <header className="px-4 pb-2 pt-6">
        <h1 className="text-xl font-bold">Profile</h1>
      </header>

      <div className="px-4 pt-3">
        <Link href="/settings" className="flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold">{user?.name}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
          <ChevronRight size={18} className="text-muted" />
        </Link>

        {menuGroups.map((group, gi) => (
          <div key={gi} className="mt-4 divide-y divide-border rounded-2xl bg-surface shadow-sm shadow-black/[0.03]">
            {group.items.map(({ icon: Icon, label, href }) => (
              <Link key={label} href={href} className="flex items-center gap-3 px-4 py-3.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light">
                  <Icon size={16} className="text-primary" />
                </span>
                <span className="flex-1 text-sm">{label}</span>
                <ChevronRight size={16} className="text-muted" />
              </Link>
            ))}
          </div>
        ))}

        <LogoutButton />

        <p className="mt-4 text-center text-xs text-muted">Version 1.0</p>
      </div>

      <BottomNav />
    </Screen>
  );
}
