"use client";

import { Download } from "lucide-react";
import { formatDateShort, daysSince, ordinal } from "@/lib/format";

const RED = [225, 60, 65];
const GREEN = [30, 165, 90];
const ORANGE = [235, 160, 40];
const BLUE = [55, 120, 220];
const GRAY = [145, 145, 155];
const INK = [25, 25, 35];

const SIZE_BODY = 9;
const SIZE_EMPHASIS = 11;
const SIZE_TITLE = 14;
const SIZE_NAME = 20;

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

function statRow(doc, margin, contentWidth, y, label, value, color) {
  doc.setTextColor(...GRAY);
  doc.setFontSize(SIZE_BODY);
  doc.setFont(undefined, "normal");
  doc.text(label, margin, y);
  doc.setTextColor(...color);
  doc.setFontSize(SIZE_EMPHASIS);
  doc.setFont(undefined, "bold");
  doc.text(value, margin + contentWidth, y, { align: "right" });
  return y + 10;
}

function dashedRule(doc, margin, contentWidth, y) {
  doc.setDrawColor(225, 225, 230);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([1.2, 1], 0);
  doc.line(margin, y, margin + contentWidth, y);
  doc.setLineDashPattern([], 0);
}

function drawFooter(doc, margin, contentWidth, pageHeight) {
  const y = pageHeight - 14;
  doc.setDrawColor(225, 225, 230);
  doc.setLineWidth(0.3);
  doc.line(margin, y - 5, margin + contentWidth, y - 5);

  doc.setFontSize(SIZE_BODY);
  doc.setTextColor(...GRAY);
  doc.setFont(undefined, "normal");
  doc.text(
    `Generated on ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}   |   Monthly Expenses`,
    margin,
    y
  );

  doc.setFontSize(SIZE_BODY);
  doc.setFont(undefined, "italic");
  doc.setTextColor(...INK);
  doc.text("Thank You!", margin + contentWidth, y, { align: "right" });
}

function paymentTable(doc, autoTable, title, payments, startY, margin, contentWidth, amountColor, emptyLabel) {
  doc.setFontSize(SIZE_EMPHASIS);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...INK);
  doc.text(title, margin, startY);

  autoTable(doc, {
    startY: startY + 5,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    head: [["Date", "Method", "Remarks", "Amount"]],
    body: payments.length
      ? payments.map((p) => [formatDateShort(p.date), p.method === "upi" ? "UPI" : "Cash", sanitizeForPdf(p.remarks) || "—", formatAmountPdf(p.amount)])
      : [["—", "—", emptyLabel, "—"]],
    theme: "plain",
    styles: { fontSize: SIZE_BODY, cellPadding: { top: 3, bottom: 3, left: 0, right: 0 }, textColor: INK },
    headStyles: { textColor: GRAY, fontStyle: "normal", fontSize: SIZE_BODY },
    bodyStyles: { lineColor: [232, 232, 236], lineWidth: { bottom: 0.2 } },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 26, fontStyle: "bold" },
      2: { cellWidth: "auto" },
      3: { cellWidth: 34, halign: "right", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "head") {
        data.cell.styles.lineWidth = { bottom: 0.4 };
        data.cell.styles.lineColor = [210, 210, 216];
      }
      if (data.section === "body" && data.column.index === 3 && payments.length) {
        data.cell.styles.textColor = amountColor;
      }
    },
  });

  return doc.lastAutoTable.finalY;
}

async function generateLendingPdf(lending) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 16;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;

  const interestPayments = [...lending.payments].filter((p) => p.type === "interest").sort((a, b) => new Date(a.date) - new Date(b.date));
  const principalPayments = [...lending.payments].filter((p) => p.type === "principal").sort((a, b) => new Date(a.date) - new Date(b.date));
  const totalInterest = interestPayments.reduce((s, p) => s + p.amount, 0);
  const totalPrincipalPaid = principalPayments.reduce((s, p) => s + p.amount, 0);
  const outstanding = Math.max(0, lending.principal - totalPrincipalPaid);
  const expectedMonthlyInterest = Math.round((outstanding * (lending.interestRatePercent || 0)) / 100);
  const isClosed = lending.status === "closed";

  // Title
  doc.setTextColor(...INK);
  doc.setFontSize(SIZE_TITLE);
  doc.setFont(undefined, "bold");
  doc.setCharSpace(1.1);
  doc.text("LENDING STATEMENT", pageWidth / 2, 20, { align: "center" });
  doc.setCharSpace(0);

  doc.setDrawColor(220, 220, 226);
  doc.setLineWidth(0.4);
  doc.line(margin, 26, margin + contentWidth, 26);

  // Borrower name + status pill
  doc.setFontSize(SIZE_NAME);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...INK);
  doc.text(lending.borrower, margin, 38);

  const statusLabel = isClosed ? "CLOSED" : "ACTIVE";
  const statusColor = isClosed ? GRAY : GREEN;
  doc.setFontSize(SIZE_BODY);
  doc.setFont(undefined, "bold");
  const pillW = doc.getTextWidth(statusLabel) + 10;
  const pillX = margin + contentWidth - pillW;
  doc.setFillColor(...(isClosed ? [238, 238, 242] : [223, 247, 232]));
  doc.roundedRect(pillX, 31, pillW, 8, 4, 4, "F");
  doc.setTextColor(...statusColor);
  doc.text(statusLabel, pillX + pillW / 2, 36.3, { align: "center" });

  // Subtitle
  doc.setFontSize(SIZE_BODY);
  doc.setFont(undefined, "normal");
  doc.setTextColor(...GRAY);
  doc.text(
    `${lending.mobile || "No mobile"}   |   Given on ${formatDateShort(lending.dateGiven)}   |   ${daysSince(lending.dateGiven)} days ago`,
    margin,
    45
  );

  let y = 60;

  y = statRow(doc, margin, contentWidth, y, "Principal (Asal)", formatAmountPdf(lending.principal), RED);
  y = statRow(doc, margin, contentWidth, y, "Principal Paid", formatAmountPdf(totalPrincipalPaid), GREEN);
  y = statRow(doc, margin, contentWidth, y, "Outstanding", formatAmountPdf(outstanding), ORANGE);

  dashedRule(doc, margin, contentWidth, y - 4);

  y = statRow(doc, margin, contentWidth, y, "Interest Collected", formatAmountPdf(totalInterest), BLUE);
  y = statRow(doc, margin, contentWidth, y, "Interest Rate", `${lending.interestRatePercent || 0}% / month`, BLUE);
  y = statRow(doc, margin, contentWidth, y, "Expected Monthly Interest", formatAmountPdf(expectedMonthlyInterest), BLUE);

  dashedRule(doc, margin, contentWidth, y - 4);
  y += 3;

  if (lending.interestDueDay) {
    doc.setFontSize(SIZE_BODY);
    doc.setTextColor(...GRAY);
    doc.setFont(undefined, "normal");
    doc.text(`Interest due on the ${ordinal(lending.interestDueDay)} of every month.`, margin, y);
    y += 7;
  }

  if (lending.note) {
    const noteLines = doc.splitTextToSize(sanitizeForPdf(lending.note), contentWidth);
    doc.setFontSize(SIZE_BODY);
    doc.setTextColor(...GRAY);
    doc.setFont(undefined, "normal");
    doc.text(noteLines, margin, y);
    y += noteLines.length * 5.5 + 4;
  }

  y += 5;

  y = paymentTable(doc, autoTable, "Interest Payments", interestPayments, y, margin, contentWidth, BLUE, "No interest payments logged yet.");
  paymentTable(doc, autoTable, "Principal Payments", principalPayments, y + 12, margin, contentWidth, GREEN, "No principal payments logged yet.");

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
