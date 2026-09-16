import Link from "next/link";
import { Landmark, ShieldCheck, Wallet2 } from "lucide-react";
import { getIcon } from "@/lib/icons";
import Screen from "@/components/Screen";
import BottomNav from "@/components/BottomNav";
import AccountForm from "@/components/AccountForm";
import BankLinkCard from "@/components/BankLinkCard";
import { formatCurrency } from "@/lib/format";
import { requireUserId } from "@/lib/session";
import { getAccounts, getBankLinks } from "@/lib/data";
import { createAccount } from "@/lib/actions/accounts";

export default async function AccountsPage() {
  const userId = await requireUserId();
  const [accounts, bankLinks] = await Promise.all([getAccounts(userId), getBankLinks(userId)]);
  const accountsById = new Map(accounts.map((a) => [a._id, a]));
  const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <Screen wide>
      <header className="flex items-center justify-between px-4 pb-2 pt-6 md:hidden">
        <h1 className="text-xl font-bold">Accounts</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/accounts/link"
            aria-label="Link bank account"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-primary"
          >
            <ShieldCheck size={16} />
          </Link>
          <AccountForm action={createAccount} />
        </div>
      </header>

      <div className="space-y-4 px-4 pt-3 md:px-8 md:pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
            <p className="text-xs text-muted">Net Worth</p>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(netWorth)}</p>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/accounts/link"
              className="flex items-center gap-1.5 rounded-full bg-primary-light px-4 py-2 text-xs font-semibold text-primary-dark"
            >
              <ShieldCheck size={14} />
              Link Bank Account
            </Link>
            <AccountForm action={createAccount} />
          </div>
        </div>

        {bankLinks.length ? (
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Landmark size={16} className="text-primary" />
              Connected Bank Accounts
            </h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bankLinks.map((link) => (
                <BankLinkCard key={link._id} link={link} account={link.accountId ? accountsById.get(link.accountId) : null} />
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Wallet2 size={16} className="text-primary" />
            Manual Accounts
          </h2>

          {accounts.length ? (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          ) : (
            <div className="mt-3 flex flex-col items-center rounded-2xl bg-surface p-8 text-center shadow-sm shadow-black/[0.03]">
              <Landmark size={32} className="text-muted" strokeWidth={1.5} />
              <p className="mt-4 text-sm font-semibold">No Accounts Yet</p>
              <p className="mt-1 text-xs text-muted">Add a bank, cash, or card account to track balances.</p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </Screen>
  );
}
