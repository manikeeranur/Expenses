"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Wallet, PiggyBank } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import AddTransactionModal from "@/components/AddTransactionModal";
import { navItems } from "@/lib/navItems";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex items-center gap-2.5 px-6 pt-7 pb-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
          <Wallet size={18} />
        </div>
        <span className="text-base font-bold">Monthly Expenses</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 no-scrollbar">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-primary-light text-primary-dark" : "text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              <Icon size={19} stroke={active ? 2.25 : 1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <div className="rounded-2xl bg-background p-4 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-light">
            <PiggyBank size={22} className="text-primary" />
          </div>
          <p className="mt-3 text-sm font-bold">Track. Analyze. Save.</p>
          <p className="mt-1 text-xs text-muted">Take control of your finances and achieve your goals.</p>
          <AddTransactionModal>
            {(open) => (
              <button
                type="button"
                onClick={open}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-semibold text-white shadow-md shadow-primary/25"
              >
                <Plus size={14} />
                Add Transaction
              </button>
            )}
          </AddTransactionModal>
        </div>

        <div className="mt-2 border-t border-border pt-2">
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
