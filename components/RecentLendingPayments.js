import { IndianRupee, Percent } from "lucide-react";
import { formatCurrencyPrecise, formatDateShort } from "@/lib/format";

export default function RecentLendingPayments({ payments }) {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
          <IndianRupee size={17} />
        </span>
        <h2 className="flex-1 text-sm font-bold">Recent Transactions</h2>
      </div>

      {payments.length ? (
        <div className="mt-3 space-y-3">
          {payments.map((p, i) => {
            const isInterest = p.type === "interest";
            return (
              <div key={`${p.lendingId}-${i}`} className="flex items-center gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    isInterest ? "bg-info-light text-info" : "bg-success-light text-success"
                  }`}
                >
                  {isInterest ? <Percent size={15} /> : <IndianRupee size={15} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {isInterest ? "Interest received from " : "Payment received from "}
                    <span className="font-semibold">{p.borrower}</span>
                  </p>
                  <p className="text-xs text-muted">{isInterest ? "Interest payment" : "Principal payment"}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-success">+{formatCurrencyPrecise(p.amount)}</p>
                  <p className="text-[11px] text-muted">{formatDateShort(p.date)}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 rounded-xl bg-background p-4 text-center text-xs text-muted">No payments recorded yet.</p>
      )}
    </div>
  );
}
