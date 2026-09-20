"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome2, IconReceipt2, IconQrcode, IconCoinRupee, IconUserCircle } from "@tabler/icons-react";

const items = [
  { href: "/dashboard", label: "Home", icon: IconHome2 },
  { href: "/transactions", label: "Transactions", icon: IconReceipt2 },
  { href: "/transactions/pay", label: "Scan QR", icon: IconQrcode },
  { href: "/lending", label: "Lending", icon: IconCoinRupee },
  { href: "/profile", label: "Profile", icon: IconUserCircle },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-border bg-surface/95 backdrop-blur px-4 pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="flex items-center justify-between py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link href={href} aria-label={label} className="flex items-center justify-center px-3 py-1">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                    active ? "bg-primary-light text-primary" : "text-muted"
                  }`}
                >
                  <Icon size={22} stroke={active ? 2.25 : 1.75} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
