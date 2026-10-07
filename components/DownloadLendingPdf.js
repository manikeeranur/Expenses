"use client";

import { Download } from "lucide-react";
import { formatDateShort } from "@/lib/format";
import { computeLendingStats } from "@/lib/lending";

// The statement is in Tamil, which jsPDF's built-in fonts can't shape
// (conjuncts and vowel signs come out broken). So the page is laid out as
// plain HTML with Noto Sans Tamil, rasterized with html2canvas-pro (the
// "-pro" fork understands Tailwind v4's oklch colors), and placed into the PDF.

const PAGE_WIDTH_PX = 794; // A4 at 96dpi
const PAGE_HEIGHT_PX = 1123;
const FONT_HREF = "https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;600;700&display=swap";
const FONT_FAMILY = "'Noto Sans Tamil', sans-serif";

const INK = "#1f2937";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const RULE = "#d1d5db";
const GREEN = "#16a34a";
const AMBER = "#d4a106";
const RED = "#dc2626";

const METHOD_LABELS = { upi: "UPI", cash: "Cash" };

function formatAmountTa(amount) {
  return `ரூ. ${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

async function ensureTamilFont() {
  if (!document.querySelector(`link[href="${FONT_HREF}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
    await new Promise((resolve) => {
      link.onload = resolve;
      link.onerror = resolve;
    });
  }
  // Load every weight we use before rasterizing, or the first export falls
  // back to a system font.
  await Promise.all(["400", "600", "700"].map((w) => document.fonts.load(`${w} 16px 'Noto Sans Tamil'`, "கடன்").catch(() => {})));
}

function summaryRow(label, value, valueStyle = "") {
  return `
    <tr>
      <td style="padding:12px 6px;color:${MUTED};border-bottom:1px solid ${BORDER};">${label}</td>
      <td style="padding:12px 6px;text-align:right;border-bottom:1px solid ${BORDER};${valueStyle}">${value}</td>
    </tr>`;
}

function paymentSection(title, payments, total) {
  const rows = payments.length
    ? payments
        .map(
          (p) => `
      <tr>
        <td style="padding:12px 6px;border-bottom:1px solid ${BORDER};">${formatDateShort(p.date)}</td>
        <td style="padding:12px 6px;border-bottom:1px solid ${BORDER};">${METHOD_LABELS[p.method] || "Cash"}</td>
        <td style="padding:12px 6px;border-bottom:1px solid ${BORDER};text-align:right;">${formatAmountTa(p.amount)}</td>
      </tr>`
        )
        .join("")
    : `<tr><td colspan="3" style="padding:14px 6px;color:${MUTED};text-align:center;border-bottom:1px solid ${BORDER};">பதிவுகள் இல்லை</td></tr>`;

  return `
    <h2 style="margin:40px 0 12px;font-size:14px;font-weight:600;color:${INK};">${title}</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr style="color:${MUTED};font-size:12px;">
          <th style="padding:8px 6px;text-align:left;font-weight:400;border-bottom:2px solid ${RULE};width:36%;">தேதி</th>
          <th style="padding:8px 6px;text-align:left;font-weight:400;border-bottom:2px solid ${RULE};">முறை</th>
          <th style="padding:8px 6px;text-align:right;font-weight:400;border-bottom:2px solid ${RULE};">தொகை</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr style="font-weight:700;">
          <td style="padding:12px 6px;border-top:2px solid ${RULE};" colspan="2">மொத்தம்</td>
          <td style="padding:12px 6px;border-top:2px solid ${RULE};text-align:right;">${formatAmountTa(total)}</td>
        </tr>
      </tfoot>
    </table>`;
}

function buildStatementHtml(lending) {
  const byDate = (a, b) => new Date(a.date) - new Date(b.date);
  const interestPayments = lending.payments.filter((p) => p.type === "interest").sort(byDate);
  const principalPayments = lending.payments.filter((p) => p.type === "principal").sort(byDate);
  const { totalInterest, totalPrincipalRepaid, outstanding, expectedMonthlyInterest } = computeLendingStats(lending);
  const rate = lending.interestRatePercent || 0;

  return `
    <div style="flex:1;">
      <h1 style="margin:0;text-align:center;font-size:14px;font-weight:700;color:${INK};">கடன் அறிக்கை</h1>
      <div style="width:46px;height:3px;background:${INK};margin:14px auto 30px;border-radius:2px;"></div>

      <table style="width:100%;border-collapse:collapse;font-size:12px;border-top:2px solid ${RULE};">
        ${summaryRow("கடன் பெற்றவர்", escapeHtml(lending.borrower), "font-weight:700;")}
        ${summaryRow("தொடர்பு எண்", escapeHtml(lending.mobile || "—"))}
        ${summaryRow("கடன் வழங்கிய தேதி", formatDateShort(lending.dateGiven))}
        ${summaryRow("அசல் தொகை", formatAmountTa(lending.principal), `color:${GREEN};font-weight:700;`)}
        ${summaryRow("செலுத்தப்பட்ட அசல்", formatAmountTa(totalPrincipalRepaid), `color:${AMBER};font-weight:700;`)}
        ${summaryRow("நிலுவைத் தொகை", formatAmountTa(outstanding), `color:${RED};font-weight:700;`)}
        ${summaryRow("வட்டி விகிதம்", `${rate}% / மாதம் (${formatAmountTa(expectedMonthlyInterest)})`, `color:${RED};font-weight:700;`)}
        ${summaryRow("வசூலான வட்டி", formatAmountTa(totalInterest))}
      </table>

      ${paymentSection("வட்டி செலுத்துதல்கள்", interestPayments, totalInterest)}
      ${paymentSection("அசல் செலுத்துதல்கள்", principalPayments, totalPrincipalRepaid)}
    </div>
    <p style="margin:40px 0 0;text-align:center;font-size:12px;color:${MUTED};">உருவாக்கப்பட்ட தேதி: ${formatDateShort(new Date())}</p>`;
}

async function generateLendingPdf(lending) {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([import("jspdf"), import("html2canvas-pro")]);
  await ensureTamilFont();

  // Off-screen A4-width page; min-height pins the footer to the bottom of
  // page one when the statement is short.
  const page = document.createElement("div");
  page.style.cssText = `position:fixed;left:-10000px;top:0;width:${PAGE_WIDTH_PX}px;min-height:${PAGE_HEIGHT_PX}px;box-sizing:border-box;padding:48px;display:flex;flex-direction:column;background:#fff;color:${INK};font-family:${FONT_FAMILY};line-height:1.4;`;
  page.innerHTML = buildStatementHtml(lending);
  document.body.appendChild(page);

  try {
    const canvas = await html2canvas(page, { scale: 2, backgroundColor: "#ffffff" });
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    const img = canvas.toDataURL("image/jpeg", 0.95);

    // Long payment histories run past one page: shift the same image up by
    // one page height per extra page.
    for (let offset = 0; offset < imgHeight - 0.5; offset += pdfHeight) {
      if (offset > 0) doc.addPage();
      doc.addImage(img, "JPEG", 0, -offset, pdfWidth, imgHeight);
    }

    doc.save(`lending-${lending.borrower.trim().replace(/\s+/g, "-")}.pdf`);
  } finally {
    page.remove();
  }
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
