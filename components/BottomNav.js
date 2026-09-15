"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome2, IconReceipt2, IconChartPie, IconCoinRupee, IconUserCircle } from "@tabler/icons-react";
import { Plus } from "lucide-react";
import AddTransactionModal from "@/components/AddTransactionModal";

const items = [
  { href: "/dashboard", label: "Home", icon: IconHome2 },
  { href: "/transactions", label: "Transactions", icon: IconReceipt2 },
  { href: "/transactions/add", label: "Add", icon: Plus, isFab: true },
  { href: "/lending", label: "Lending", icon: IconCoinRupee },
  { href: "/reports", label: "Reports", icon: IconChartPie },
  { href: "/profile", label: "Profile", icon: IconUserCircle },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-border bg-surface/95 backdrop-blur px-4 pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="flex items-center justify-between py-2">
        {items.map(({ href, label, icon: Icon, isFab }) => {
          const active = pathname === href;
          if (isFab) {
            return (
              <li key={href} className="-mt-6">
                <AddTransactionModal>
                  {(open) => (
                    <button
                      type="button"
                      onClick={open}
                      aria-label={label}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30"
                    >
                      <Icon size={26} strokeWidth={2.5} />
                    </button>
                  )}
                </AddTransactionModal>
              </li>
            );
          }
          return (
            <li key={href}>
              <Link
                href={href}
                aria-label={label}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 text-[11px] font-medium ${
                  active ? "text-primary" : "text-muted"
                }`}
              >
                <Icon size={22} stroke={active ? 2.25 : 1.75} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
