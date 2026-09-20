"use client";

import { Download } from "lucide-react";
import { formatDateShort, daysSince } from "@/lib/format";

const GRAY = [130, 130, 140];
const INK = [25, 25, 35];
const BORDER = [220, 220, 226];
const LABEL_FILL = [244, 244, 247];

const SIZE_BODY = 9;
const SIZE_SECTION = 11;
const SIZE_TITLE = 18;
const SIZE_CAPTION = 9;

function formatAmountPdf(amount) {
  return `Rs. ${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// jsPDF's built-in fonts can't render ₹ (it prints as a garbled superscript
// glyph), so any free-text field the user typed (note, remarks) is sanitized
// before it goes into the PDF, not just the amounts we format ourselves.
function sanitizeForPdf(text) {
  if (!text) return text;
  return String(text).replace(/₹/g, "Rs. ");
}

// A short prose line describing the principal side of the loan — mirrors
// how a human would summarize it on a statement, not just a raw table row.
function buildSettlementNarrative(lending, principalPayments, totalPrincipalPaid, outstanding) {
  if (!principalPayments.length) {
    return `No principal repayments have been recorded yet for ${lending.borrower}. The full principal of ${formatAmountPdf(
      lending.principal
    )} remains outstanding, as recorded in the lending sheet.`;
  }
  if (principalPayments.length === 1) {
    const p = principalPayments[0];
    return `${formatAmountPdf(p.amount)} of the principal was settled to ${lending.borrower} on ${formatDateShort(
      p.date
    )}, leaving ${formatAmountPdf(outstanding)} outstanding, as recorded in the lending sheet.`;
  }
  const last = principalPayments[principalPayments.length - 1];
  return `A total of ${formatAmountPdf(totalPrincipalPaid)} has been settled across ${principalPayments.length} payments (latest on ${formatDateShort(
    last.date
  )}), leaving ${formatAmountPdf(outstanding)} outstanding, as recorded in the lending sheet.`;
}

function keyValueTable(doc, autoTable, rows, startY, margin, contentWidth, labelWidthPct) {
  autoTable(doc, {
    startY,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    theme: "grid",
    body: rows,
    styles: { fontSize: SIZE_BODY, textColor: INK, lineColor: BORDER, lineWidth: 0.2, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: contentWidth * labelWidthPct, fillColor: LABEL_FILL, textColor: INK, fontStyle: "bold" },
      1: { halign: "right", fontStyle: "bold" },
    },
  });
  return doc.lastAutoTable.finalY;
}

function paymentTable(doc, autoTable, payments, startY, margin, contentWidth, emptyLabel) {
  autoTable(doc, {
    startY,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    theme: "grid",
    head: [["Date", "Method", "Remarks", "Amount"]],
    body: payments.length
      ? payments.map((p) => [formatDateShort(p.date), p.method === "upi" ? "UPI" : "Cash", sanitizeForPdf(p.remarks) || "—", formatAmountPdf(p.amount)])
      : [["—", "—", emptyLabel, "—"]],
    styles: { fontSize: SIZE_BODY, textColor: INK, lineColor: BORDER, lineWidth: 0.2, cellPadding: 3 },
    headStyles: { fillColor: LABEL_FILL, textColor: INK, fontStyle: "bold" },
    columnStyles: { 3: { halign: "right" } },
  });
  return doc.lastAutoTable.finalY;
}

function sectionHeading(doc, text, margin, y) {
  doc.setFont(undefined, "bold");
  doc.setFontSize(SIZE_SECTION);
  doc.setTextColor(...INK);
  doc.text(text, margin, y);
  return y + 5;
}

function drawFooter(doc, margin, contentWidth, pageHeight) {
  const y = pageHeight - 14;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(margin, y - 5, margin + contentWidth, y - 5);

  doc.setFontSize(SIZE_BODY);
  doc.setTextColor(...GRAY);
  doc.setFont(undefined, "normal");
  doc.text(`Generated on ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`, margin, y);

  doc.setFont(undefined, "bold");
  doc.setTextColor(...INK);
  doc.text("Monthly Expenses", margin + contentWidth, y, { align: "right" });
}

async function generateLendingPdf(lending) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;

  const interestPayments = [...lending.payments].filter((p) => p.type === "interest").sort((a, b) => new Date(a.date) - new Date(b.date));
  const principalPayments = [...lending.payments].filter((p) => p.type === "principal").sort((a, b) => new Date(a.date) - new Date(b.date));
  const totalInterest = interestPayments.reduce((s, p) => s + p.amount, 0);
  const totalPrincipalPaid = principalPayments.reduce((s, p) => s + p.amount, 0);
  const outstanding = Math.max(0, lending.principal - totalPrincipalPaid);
  const expectedMonthlyInterest = Math.round((outstanding * (lending.interestRatePercent || 0)) / 100);
  const isClosed = lending.status === "closed";

  let y = 14;

  doc.setFont(undefined, "bold");
  doc.setFontSize(SIZE_CAPTION);
  doc.setTextColor(...GRAY);
  doc.setCharSpace(0.8);
  doc.text("MONTHLY EXPENSES", pageWidth / 2, y, { align: "center" });
  doc.setCharSpace(0);
  y += 9;

  doc.setFontSize(SIZE_TITLE);
  doc.setTextColor(...INK);
  doc.setCharSpace(1);
  doc.text("LENDING STATEMENT", pageWidth / 2, y, { align: "center" });
  doc.setCharSpace(0);
  y += 6;

  doc.setFont(undefined, "normal");
  doc.setFontSize(SIZE_CAPTION);
  doc.setTextColor(...GRAY);
  doc.text("Detailed statement of lending, repayments and interest", pageWidth / 2, y, { align: "center" });
  y += 10;

  y = keyValueTable(
    doc,
    autoTable,
    [
      ["Borrower", lending.borrower],
      ["Status", isClosed ? "CLOSED" : "ACTIVE"],
      ["Given on", `${formatDateShort(lending.dateGiven)} • ${daysSince(lending.dateGiven)} days ago`],
      ["Contact", lending.mobile || "No mobile number"],
    ],
    y,
    margin,
    contentWidth,
    0.35
  );
  y += 8;

  y = sectionHeading(doc, "LOAN SUMMARY", margin, y);
  y = keyValueTable(
    doc,
    autoTable,
    [
      ["Principal", formatAmountPdf(lending.principal)],
      ["Principal Paid", formatAmountPdf(totalPrincipalPaid)],
      ["Outstanding", formatAmountPdf(outstanding)],
      ["Interest Collected", formatAmountPdf(totalInterest)],
      ["Interest Rate", `${lending.interestRatePercent || 0}% / month`],
      ["Expected Monthly Interest", formatAmountPdf(expectedMonthlyInterest)],
    ],
    y,
    margin,
    contentWidth,
    0.5
  );
  y += 8;

  y = sectionHeading(doc, "SETTLEMENT DETAILS", margin, y);
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    theme: "grid",
    body: [[buildSettlementNarrative(lending, principalPayments, totalPrincipalPaid, outstanding)]],
    styles: { fontSize: SIZE_BODY, textColor: INK, lineColor: BORDER, lineWidth: 0.2, cellPadding: 4 },
  });
  y = doc.lastAutoTable.finalY + 8;

  y = sectionHeading(doc, "INTEREST PAYMENTS", margin, y);
  y = paymentTable(doc, autoTable, interestPayments, y, margin, contentWidth, "No interest payments logged yet.");
  y += 8;

  y = sectionHeading(doc, "PRINCIPAL PAYMENTS", margin, y);
  paymentTable(doc, autoTable, principalPayments, y, margin, contentWidth, "No principal payments logged yet.");

  // Same footer on every page, not just the last one.
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawFooter(doc, margin, contentWidth, pageHeight);
  }

  doc.save(`lending-${lending.borrower.trim().replace(/\s+/g, "-")}.pdf`);
}

export default function DownloadLendingPdf({ lending }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        generateLendingPdf(lending);
      }}
      aria-label="Download PDF"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-background"
    >
      <Download size={16} />
    </button>
  );
}
