"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { RefreshCw, Check, Clock, XCircle } from "lucide-react";
import { checkBankLinkStatus } from "@/lib/actions/bank-link";

const STATUS_COPY = {
  PENDING: { icon: Clock, label: "Waiting for your approval", tone: "text-warning" },
  ACTIVE: { icon: Check, label: "Consent approved — fetching your data", tone: "text-success" },
  REJECTED: { icon: XCircle, label: "Consent was declined", tone: "text-danger" },
  EXPIRED: { icon: XCircle, label: "Consent request expired", tone: "text-danger" },
  REVOKED: { icon: XCircle, label: "Consent was revoked", tone: "text-danger" },
  PAUSED: { icon: Clock, label: "Consent is paused", tone: "text-warning" },
};

export default function BankLinkStatusFlow({ link: initialLink }) {
  const [link, setLink] = useState(initialLink);
  const [checking, startChecking] = useTransition();
  const [error, setError] = useState(null);

  function handleCheck() {
    setError(null);
    startChecking(async () => {
      const res = await checkBankLinkStatus(link._id);
      if (res?.error) setError(res.error);
      else setLink((l) => ({ ...l, consentStatus: res.consentStatus, dataSessionStatus: res.dataSessionStatus }));
    });
  }

  const synced = link.dataSessionStatus === "COMPLETED" && link.accountId;
  const status = STATUS_COPY[link.consentStatus] || STATUS_COPY.PENDING;
  const Icon = synced ? Check : status.icon;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-8 text-center">
      <span className={`flex h-20 w-20 items-center justify-center rounded-full ${synced ? "bg-success-light" : "bg-primary-light"}`}>
        <Icon size={32} className={synced ? "text-success" : status.tone} />
      </span>

      <p className="mt-5 text-lg font-bold">{link.vua}</p>
      <p className={`mt-1 text-sm ${synced ? "text-success" : status.tone}`}>
        {synced ? "Linked — your real account and transactions are synced" : status.label}
      </p>

      {link.dataSessionStatus && link.dataSessionStatus !== "COMPLETED" ? (
        <p className="mt-1 text-xs text-muted">Data session: {link.dataSessionStatus}</p>
      ) : null}

      {error ? <p className="mt-4 text-xs font-medium text-danger">{error}</p> : null}

      {!synced ? (
        <button
          type="button"
          onClick={handleCheck}
          disabled={checking}
          className="mt-8 flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-60"
        >
          <RefreshCw size={14} className={checking ? "animate-spin" : ""} />
          {checking ? "Checking..." : "Check Status"}
        </button>
      ) : (
        <Link
          href={`/accounts/${link.accountId}`}
          className="mt-8 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25"
        >
          View Account
        </Link>
      )}

      <Link href="/accounts" className="mt-4 text-xs font-medium text-muted">
        Back to Accounts
      </Link>
    </div>
  );
}
