"use client";

import { useActionState } from "react";
import Link from "next/link";
import { X, ArrowDownToLine, Landmark } from "lucide-react";
import { requestInstantSettlement } from "@/lib/actions/payments";
import { formatCurrency, formatDateShort } from "@/lib/format";

const STATUS_TONE = {
  processed: "text-success",
  initiated: "text-warning",
  reversed: "text-danger",
  failed: "text-danger",
};

export default function SettleFlow({ settlements }) {
  const [state, action, pending] = useActionState(requestInstantSettlement, undefined);

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 pt-6 md:pt-10">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Withdraw to Bank</h1>
        <Link href="/pay" aria-label="Cancel" className="flex h-8 w-8 items-center justify-center rounded-full bg-surface">
          <X size={16} />
        </Link>
      </div>

      <p className="mt-2 text-xs text-muted">
        Instantly settles your available Razorpay balance to your linked bank account, instead of waiting for the normal T+2
        settlement cycle. Only works once your Razorpay account is fully KYC&apos;d and live.
      </p>

      <form
        action={(formData) => {
          formData.set("note", "Instant withdrawal from Monthly Expenses");
          action(formData);
        }}
        className="mt-6"
      >
        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-60"
        >
          <ArrowDownToLine size={16} />
          {pending ? "Requesting..." : "Withdraw Full Balance Now"}
        </button>
      </form>

      {state?.error ? <p className="mt-4 rounded-2xl bg-danger-light p-3.5 text-xs text-danger">{state.error}</p> : null}
      {state?.success ? (
        <p className="mt-4 rounded-2xl bg-success-light p-3.5 text-xs text-success">
          Settlement requested — {formatCurrency(state.amount)} ({state.status})
        </p>
      ) : null}

      <div className="mt-8">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          <Landmark size={15} />
          Recent Instant Settlements
        </h2>
        <div className="mt-3 space-y-2.5">
          {settlements.length ? (
            settlements.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-2xl bg-surface p-3.5 shadow-sm shadow-black/[0.03]">
                <div>
                  <p className="text-sm font-semibold">{formatCurrency(s.amount / 100)}</p>
                  <p className="text-xs text-muted">{formatDateShort(s.created_at * 1000)}</p>
                </div>
                <span className={`text-xs font-medium capitalize ${STATUS_TONE[s.status] || "text-muted"}`}>{s.status}</span>
              </div>
            ))
          ) : (
            <p className="rounded-2xl bg-surface p-4 text-center text-xs text-muted shadow-sm shadow-black/[0.03]">
              No instant settlements yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
