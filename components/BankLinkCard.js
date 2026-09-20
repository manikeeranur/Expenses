"use client";

import { useState, useTransition } from "react";
import { RefreshCw, Unlink, Landmark } from "lucide-react";
import Tag from "@/components/ui/Tag";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { syncBankLink, disconnectBankLink } from "@/lib/actions/bank-link";
import { formatCurrency, formatDate } from "@/lib/format";

const STATUS_TONE = {
  ACTIVE: "success",
  PENDING: "warning",
  INITIATED: "warning",
  PAUSED: "warning",
  REJECTED: "danger",
  EXPIRED: "danger",
  REVOKED: "danger",
};

export default function BankLinkCard({ link, account }) {
  const [syncing, startSync] = useTransition();
  const [disconnecting, startDisconnect] = useTransition();
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleSync() {
    setError(null);
    startSync(async () => {
      const res = await syncBankLink(link._id);
      if (res?.error) setError(res.error);
    });
  }

  function handleDisconnect() {
    setConfirmOpen(true);
  }

  const isActive = link.consentStatus === "ACTIVE";

  return (
    <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
            <Landmark size={18} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{account?.bankName || account?.name || "Linked Bank"}</p>
            {account?.last4 ? <p className="text-xs text-muted">•••• {account.last4}</p> : null}
          </div>
        </div>
        <Tag tone={STATUS_TONE[link.consentStatus] || "neutral"}>{link.consentStatus}</Tag>
      </div>

      {account ? <p className="mt-3 text-lg font-bold">{formatCurrency(account.balance)}</p> : null}

      <p className="mt-1 text-xs text-muted">
        {link.lastSyncedAt
          ? `Last synced ${formatDate(link.lastSyncedAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}`
          : "Not synced yet"}
      </p>

      {error ? <p className="mt-2 text-xs font-medium text-danger">{error}</p> : null}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing || !isActive}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-xs font-semibold disabled:opacity-50"
        >
          <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing..." : "Sync"}
        </button>
        <button
          type="button"
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-danger/30 py-2.5 text-xs font-semibold text-danger disabled:opacity-50"
        >
          <Unlink size={13} />
          {disconnecting ? "Disconnecting..." : "Disconnect"}
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Disconnect this bank account?"
        description="Already-imported transactions will be kept."
        confirmLabel="Disconnect"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          startDisconnect(() => disconnectBankLink(link._id));
        }}
      />
    </div>
  );
}
