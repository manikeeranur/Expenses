"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Upload, FileSpreadsheet, Check, AlertTriangle } from "lucide-react";
import { parseCsv, mapBankRows } from "@/lib/csv";
import { importTransactions } from "@/lib/actions/accounts";
import { formatCurrency, formatDateShort } from "@/lib/format";

export default function ImportStatementFlow({ accountId }) {
  const [fileName, setFileName] = useState(null);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [pending, startTransition] = useTransition();

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseCsv(String(reader.result));
        const mapped = mapBankRows(parsed);
        if (!mapped.length) {
          setError("Couldn't find recognizable Date / Amount columns in this CSV. Expected headers like Date, Description, Debit/Credit or Date, Description, Amount.");
          setRows(null);
        } else {
          setRows(mapped);
        }
      } catch {
        setError("Couldn't read this file. Make sure it's a plain CSV export.");
      }
    };
    reader.readAsText(file);
  }

  function handleImport() {
    startTransition(async () => {
      const res = await importTransactions(accountId, rows);
      if (res?.error) setError(res.error);
      else setResult(res);
    });
  }

  if (result?.success) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-8 pt-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
          <Check size={28} className="text-success" />
        </span>
        <h2 className="mt-5 text-lg font-bold">{result.count} transactions imported</h2>
        <p className="mt-1 text-sm text-muted">They now appear in this account and across your reports.</p>
        <Link
          href={`/accounts/${accountId}`}
          className="mt-6 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25"
        >
          Back to Account
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 pt-4">
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface p-8 text-center">
        <Upload size={24} className="text-muted" />
        <span className="text-sm font-medium">{fileName || "Choose a CSV file"}</span>
        <span className="text-xs text-muted">Exported from your bank&apos;s net banking or UPI app</span>
        <input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
      </label>

      {error ? (
        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-danger-light p-3.5 text-xs text-danger">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          {error}
        </div>
      ) : null}

      {rows ? (
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold">
              <FileSpreadsheet size={15} />
              {rows.length} rows found
            </h2>
          </div>

          <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
            {rows.slice(0, 50).map((r, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-surface p-3 shadow-sm shadow-black/[0.03]">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{r.title}</p>
                  <p className="text-[11px] text-muted">{formatDateShort(r.date)}</p>
                </div>
                <p className={`shrink-0 text-xs font-semibold ${r.type === "income" ? "text-success" : "text-danger"}`}>
                  {r.type === "income" ? "+" : "-"}
                  {formatCurrency(r.amount)}
                </p>
              </div>
            ))}
            {rows.length > 50 ? (
              <p className="text-center text-[11px] text-muted">+ {rows.length - 50} more not shown</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleImport}
            disabled={pending}
            className="mt-5 flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-60"
          >
            {pending ? "Importing..." : `Import ${rows.length} Transactions`}
          </button>
        </div>
      ) : null}
    </div>
  );
}
