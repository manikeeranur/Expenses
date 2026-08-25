import Link from "next/link";
import { Landmark, ShieldCheck } from "lucide-react";
import { getIcon } from "@/lib/icons";
import Screen from "@/components/Screen";
import BottomNav from "@/components/BottomNav";
import AccountForm from "@/components/AccountForm";
import { formatCurrency } from "@/lib/format";
import { requireUserId } from "@/lib/session";
import { getAccounts } from "@/lib/data";
import { createAccount } from "@/lib/actions/accounts";

export default async function AccountsPage() {
  const userId = await requireUserId();
  const accounts = await getAccounts(userId);
  const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <Screen>
      <header className="flex items-center justify-between px-5 pb-2 pt-6 md:hidden">
        <h1 className="text-xl font-bold">Accounts</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/accounts/link"
            aria-label="Link real bank account"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-primary"
          >
            <ShieldCheck size={16} />
          </Link>
          <AccountForm action={createAccount} />
        </div>
      </header>

      <div className="hidden items-center justify-end gap-2 px-5 pt-3 md:flex md:px-8 md:pt-6">
        <Link
          href="/accounts/link"
          className="flex items-center gap-1.5 rounded-full bg-primary-light px-4 py-2 text-xs font-semibold text-primary-dark"
        >
          <ShieldCheck size={14} />
          Link Real Bank Account
        </Link>
        <AccountForm action={createAccount} />
      </div>

      {accounts.length ? (
        <div className="px-5 pt-3 md:px-8">
          <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
            <p className="text-xs text-muted">Net Worth</p>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(netWorth)}</p>
          </div>

          <div className="mt-4 space-y-3">
            {accounts.map((a) => {
              const Icon = getIcon(a.type.includes("Credit") ? "CreditCard" : a.type === "Cash" ? "Wallet2" : "Landmark");
              const negative = a.balance < 0;
              return (
                <Link
                  key={a._id}
                  href={`/accounts/${a._id}`}
                  className="block rounded-2xl p-4 text-white shadow-lg"
                  style={{ backgroundColor: a.color }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={18} />
                      <span className="text-sm font-semibold">{a.bankName || a.name}</span>
                    </div>
                    {a.last4 ? <span className="text-xs text-white/80">•••• {a.last4}</span> : null}
                  </div>
                  <p className="mt-4 text-xl font-bold">
                    {negative ? "-" : ""}
                    {formatCurrency(Math.abs(a.balance))}
                  </p>
                  <p className="mt-1 text-xs text-white/80">
                    {a.name !== a.bankName ? `${a.name} · ` : ""}
                    {a.type}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center px-8 pt-24 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-light">
            <Landmark size={40} className="text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="mt-6 text-lg font-bold">No Accounts Yet</h2>
          <p className="mt-1 text-sm text-muted">Add a bank, cash, or card account to track balances.</p>
        </div>
      )}

      <BottomNav />
    </Screen>
  );
}
