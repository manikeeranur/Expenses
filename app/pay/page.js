import Link from "next/link";
import { ArrowUpRight, ArrowDownLeft, QrCode, Wallet, ScanLine, ArrowDownToLine } from "lucide-react";
import Screen from "@/components/Screen";
import BottomNav from "@/components/BottomNav";
import { formatCurrency, formatDate, userUpiId } from "@/lib/format";
import { requireUserId } from "@/lib/session";
import { getUser, getUpiTransactions } from "@/lib/data";

export default async function PayPage() {
  const userId = await requireUserId();
  const [user, transactions] = await Promise.all([getUser(userId), getUpiTransactions(userId)]);
  const upiId = userUpiId(user?.name);

  return (
    <Screen wide>
      <header className="px-4 pb-2 pt-6 md:hidden">
        <h1 className="text-xl font-bold">UPI Pay</h1>
      </header>

      <div className="space-y-4 px-4 pt-3 md:px-8 md:pt-6">
        <div className="rounded-2xl bg-primary p-5 text-white shadow-lg shadow-primary/25">
          <div className="flex items-center gap-2 text-xs text-white/75">
            <QrCode size={14} />
            Your UPI ID
          </div>
          <p className="mt-1.5 text-lg font-bold tracking-wide">{upiId}</p>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            Real Money · via Razorpay
          </p>
          <div className="grid grid-cols-3 gap-4">
            <Link
              href="/pay/add-money"
              className="flex flex-col items-center gap-2 rounded-2xl border border-primary/30 bg-primary-light p-4 text-center"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white">
                <Wallet size={20} />
              </span>
              <span className="text-xs font-semibold text-primary-dark">Add Money</span>
            </Link>
            <Link
              href="/pay/scan"
              className="flex flex-col items-center gap-2 rounded-2xl border border-primary/30 bg-primary-light p-4 text-center"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white">
                <ScanLine size={20} />
              </span>
              <span className="text-xs font-semibold text-primary-dark">Scan to Pay</span>
            </Link>
            <Link
              href="/pay/settle"
              className="flex flex-col items-center gap-2 rounded-2xl border border-primary/30 bg-primary-light p-4 text-center"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white">
                <ArrowDownToLine size={20} />
              </span>
              <span className="text-xs font-semibold text-primary-dark">Withdraw</span>
            </Link>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Simulated · for tracking only</p>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/pay/send"
              className="flex flex-col items-center gap-2 rounded-2xl bg-surface p-5 text-center shadow-sm shadow-black/[0.03]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-light">
                <ArrowUpRight size={20} className="text-danger" />
              </span>
              <span className="text-sm font-semibold">Send Money</span>
            </Link>
            <Link
              href="/pay/receive"
              className="flex flex-col items-center gap-2 rounded-2xl bg-surface p-5 text-center shadow-sm shadow-black/[0.03]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success-light">
                <ArrowDownLeft size={20} className="text-success" />
              </span>
              <span className="text-sm font-semibold">Receive Money</span>
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Recent UPI Activity</h2>
          <div className="mt-3 space-y-2.5">
            {transactions.length ? (
              transactions.map((t) => {
                const isIncome = t.type === "income";
                return (
                  <Link
                    key={t._id}
                    href={`/transactions/${t._id}`}
                    className="flex items-center gap-3 rounded-2xl bg-surface p-3.5 shadow-sm shadow-black/[0.03]"
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full ${isIncome ? "bg-success-light" : "bg-danger-light"}`}>
                      {isIncome ? (
                        <ArrowDownLeft size={17} className="text-success" />
                      ) : (
                        <ArrowUpRight size={17} className="text-danger" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{t.title}</p>
                      <p className="truncate text-xs text-muted">
                        {formatDate(t.date, { day: "numeric", month: "short" })} · Ref {t.reference}
                      </p>
                    </div>
                    <p className={`shrink-0 text-sm font-semibold ${isIncome ? "text-success" : "text-danger"}`}>
                      {isIncome ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </p>
                  </Link>
                );
              })
            ) : (
              <p className="rounded-2xl bg-surface p-4 text-center text-xs text-muted shadow-sm shadow-black/[0.03]">
                No UPI transactions yet.
              </p>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </Screen>
  );
}
