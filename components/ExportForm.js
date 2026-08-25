"use client";

import { useState } from "react";
import { Download } from "lucide-react";

function toCsv(rows) {
  const header = ["Date", "Title", "Type", "Category", "Amount", "Account", "Method", "Tags", "Description"];
  const lines = [header.join(",")];
  for (const t of rows) {
    const cells = [
      new Date(t.date).toISOString().slice(0, 10),
      t.title,
      t.type,
      t.categoryId?.name || "",
      t.amount,
      t.accountId?.name || "",
      t.method || "",
      (t.tags || []).join("; "),
      t.description || "",
    ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`);
    lines.push(cells.join(","));
  }
  return lines.join("\n");
}

function monthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function ExportForm({ transactions }) {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [type, setType] = useState("all");

  const filtered = transactions.filter((t) => {
    const d = new Date(t.date).toISOString().slice(0, 10);
    if (d < from || d > to) return false;
    if (type !== "all" && t.type !== type) return false;
    return true;
  });

  function handleExport() {
    const csv = toCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${from}-to-${to}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5 px-5 pt-2">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Date Range</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-surface px-4 py-3 shadow-sm shadow-black/[0.03]">
            <label className="text-[11px] text-muted">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full bg-transparent text-sm font-medium outline-none"
            />
          </div>
          <div className="rounded-2xl bg-surface px-4 py-3 shadow-sm shadow-black/[0.03]">
            <label className="text-[11px] text-muted">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full bg-transparent text-sm font-medium outline-none"
            />
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Type</p>
        <div className="flex gap-3">
          {["all", "expense", "income"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 rounded-2xl border py-2.5 text-sm font-medium capitalize ${
                type === t ? "border-primary bg-primary-light text-primary-dark" : "border-border bg-surface"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-muted">{filtered.length} transaction{filtered.length === 1 ? "" : "s"} in range</p>

      <button
        type="button"
        onClick={handleExport}
        disabled={!filtered.length}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-50"
      >
        <Download size={16} />
        Export CSV
      </button>
    </div>
  );
}
