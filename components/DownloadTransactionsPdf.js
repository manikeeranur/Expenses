"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import Modal from "@/components/ui/Modal";
import DatePicker from "@/components/ui/DatePicker";
import { Label } from "@/components/ui/label";
import { getTransactionsForExport } from "@/lib/actions/transactions";
import { formatDateShort } from "@/lib/format";

function today() {
  return new Date().toISOString().slice(0, 10);
}

// jsPDF's built-in fonts can't render the ₹ glyph (it prints as a garbled
// superscript), so the PDF specifically spells out "Rs." instead.
function formatAmountPdf(amount) {
  return `Rs. ${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const MARGIN = 10;

async function generatePdf(rows, { from, to, type }) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const periodLabel = to && to !== from ? `${formatDateShort(from)} to ${formatDateShort(to)}` : formatDateShort(from);
  const typeLabel = type === "income" ? "Cr (Income)" : type === "expense" ? "Dr (Expense)" : "Cr & Dr";

  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text("Monthly Expenses", MARGIN, 18);
  doc.setFontSize(11);
  doc.setFont(undefined, "normal");
  doc.text(`Transaction Report — ${periodLabel} — ${typeLabel}`, MARGIN, 25);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `Generated on ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
    MARGIN,
    31
  );

  const totalIncome = rows.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
  const totalExpense = rows.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);

  doc.setTextColor(20);
  doc.setFontSize(10);
  const summary =
    type === "income"
      ? `Total Credit: ${formatAmountPdf(totalIncome)}`
      : type === "expense"
        ? `Total Debit: ${formatAmountPdf(totalExpense)}`
        : `Total Credit: ${formatAmountPdf(totalIncome)}    Total Debit: ${formatAmountPdf(totalExpense)}    Net: ${formatAmountPdf(totalIncome - totalExpense)}`;
  doc.text(summary, MARGIN, 39);

  autoTable(doc, {
    startY: 45,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Date", "Title", "Category", "Type", "Amount"]],
    body: rows.map((r) => [formatDateShort(r.date), r.title, r.category, r.type === "income" ? "Cr" : "Dr", formatAmountPdf(r.amount)]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [108, 92, 231] },
    tableWidth: "auto",
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: "auto" }, // Title stretches to fill the remaining page width
      2: { cellWidth: "wrap" }, // Category fits its own content
      3: { cellWidth: 16, halign: "center" },
      4: { cellWidth: 32, halign: "right" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 4) {
        const isIncome = rows[data.row.index]?.type === "income";
        data.cell.styles.textColor = isIncome ? [33, 195, 126] : [242, 85, 90];
      }
    },
  });

  const suffix = to && to !== from ? `${from}_to_${to}` : from;
  doc.save(`transactions-${suffix}.pdf`);
}

export default function DownloadTransactionsPdf({ type: defaultType }) {
  const [open, setOpen] = useState(false);
  const [dateMode, setDateMode] = useState("date");
  const [date, setDate] = useState(today());
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [type, setType] = useState(defaultType || "all");
  const [pending, setPending] = useState(false);

  async function handleDownload() {
    const range = dateMode === "date" ? { from: date, to: date } : { from, to };
    setPending(true);
    try {
      const filterType = type === "all" ? undefined : type;
      const rows = await getTransactionsForExport({ ...range, type: filterType });
      await generatePdf(rows, { ...range, type: filterType });
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background py-3 text-sm font-semibold text-muted transition-colors hover:bg-primary-light hover:text-primary"
      >
        <Download size={15} />
        Download PDF
      </button>

      {open ? (
        <Modal title="Download Transactions PDF" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <div>
              <Label>Date</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDateMode("date")}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-semibold ${dateMode === "date" ? "bg-primary-light text-primary-dark" : "bg-background text-muted"}`}
                >
                  Particular Date
                </button>
                <button
                  type="button"
                  onClick={() => setDateMode("range")}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-semibold ${dateMode === "range" ? "bg-primary-light text-primary-dark" : "bg-background text-muted"}`}
                >
                  Date Range
                </button>
              </div>
            </div>

            {dateMode === "date" ? (
              <DatePicker value={date} onChange={setDate} />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>From</Label>
                  <DatePicker value={from} onChange={setFrom} />
                </div>
                <div>
                  <Label>To</Label>
                  <DatePicker value={to} onChange={setTo} />
                </div>
              </div>
            )}

            <div>
              <Label>Type</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType("income")}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-semibold ${type === "income" ? "bg-success-light text-success" : "bg-background text-muted"}`}
                >
                  Cr
                </button>
                <button
                  type="button"
                  onClick={() => setType("expense")}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-semibold ${type === "expense" ? "bg-danger-light text-danger" : "bg-background text-muted"}`}
                >
                  Dr
                </button>
                <button
                  type="button"
                  onClick={() => setType("all")}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-semibold ${type === "all" ? "bg-primary-light text-primary-dark" : "bg-background text-muted"}`}
                >
                  Cr &amp; Dr
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-60"
            >
              <Download size={15} />
              {pending ? "Generating..." : "Download PDF"}
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
