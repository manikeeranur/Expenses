"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { X, Landmark, ShieldCheck } from "lucide-react";
import { checkMobileNumber, startBankLinkConsent } from "@/lib/actions/bank-link";

export default function LinkBankFlow() {
  const [state, action, pending] = useActionState(checkMobileNumber, undefined);
  const [linking, startLinking] = useTransition();
  const [linkError, setLinkError] = useState(null);

  function pickAccount(aa, vua) {
    setLinkError(null);
    startLinking(async () => {
      const res = await startBankLinkConsent(state.mobileNumber, aa, vua);
      if (res?.error) setLinkError(res.error);
      else if (res?.approvalUrl) window.location.href = res.approvalUrl;
    });
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 pt-6 md:pt-10">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Link Bank Account</h1>
        <Link href="/accounts" aria-label="Cancel" className="flex h-8 w-8 items-center justify-center rounded-full bg-surface">
          <X size={16} />
        </Link>
      </div>

      <p className="mt-2 text-xs text-muted">
        Connect your bank account securely — real bank linking via Setu&apos;s RBI-regulated Account Aggregator network. You&apos;ll be
        redirected to Setu&apos;s secure consent screen and must explicitly approve access there, not here.
      </p>

      {!state?.success ? (
        <form action={action} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted">Mobile Number</label>
            <input
              name="mobileNumber"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit number registered with your bank"
              required
              className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
            />
          </div>

          {state?.error ? <p className="text-xs font-medium text-danger">{state.error}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-60"
          >
            {pending ? "Checking..." : "Find Accounts"}
          </button>
        </form>
      ) : (
        <div className="mt-6">
          <p className="text-xs font-medium text-muted">Found accounts for {state.mobileNumber}</p>
          {state.usedFallback ? (
            <p className="mt-1 text-[11px] text-warning">
              No sandbox data for the number you entered, so we switched to Setu&apos;s official sandbox test number
              ({state.mobileNumber}) — the rest of this flow (consent, OTP, data fetch) is still real.
            </p>
          ) : null}
          <div className="mt-3 space-y-2.5">
            {state.accounts.map((a) => (
              <button
                key={a.vua}
                type="button"
                onClick={() => pickAccount(a.aa, a.vua)}
                disabled={linking}
                className="flex w-full items-center gap-3 rounded-2xl bg-surface p-3.5 text-left shadow-sm shadow-black/[0.03] disabled:opacity-60"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light">
                  <Landmark size={17} className="text-primary" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{a.vua}</p>
                  <p className="text-xs text-muted">via {a.aa}</p>
                </div>
              </button>
            ))}
          </div>
          {linkError ? <p className="mt-3 text-xs font-medium text-danger">{linkError}</p> : null}
          {linking ? (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
              <ShieldCheck size={13} />
              Starting your consent request…
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
