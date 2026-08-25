// Lightweight CSV parser (handles quoted fields and commas inside quotes)
// so bank/UPI statement exports can be imported without an extra dependency.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && next === "\n") i++;
      row.push(field);
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((c) => c.trim() !== "")) rows.push(row);
  }

  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cells) => {
    const record = {};
    headers.forEach((h, i) => (record[h] = (cells[i] ?? "").trim()));
    return record;
  });
}

const DATE_KEYS = ["date", "transaction date", "value date", "txn date"];
const DESC_KEYS = ["description", "narration", "particulars", "details", "remarks", "note"];
const DEBIT_KEYS = ["debit", "withdrawal", "withdrawal amt", "dr", "debit amount"];
const CREDIT_KEYS = ["credit", "deposit", "deposit amt", "cr", "credit amount"];
const AMOUNT_KEYS = ["amount", "amt", "transaction amount"];

function findKey(headers, candidates) {
  return headers.find((h) => candidates.includes(h.trim().toLowerCase()));
}

function parseAmount(value) {
  if (!value) return 0;
  const cleaned = value.toString().replace(/[₹,\s]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.abs(n) : 0;
}

function parseDate(value) {
  if (!value) return null;

  // Indian bank/UPI statements use DD/MM/YYYY (or DD-MM-YYYY), which
  // JS's native Date parser misreads as US-style MM/DD/YYYY — e.g.
  // new Date("01/08/2026") silently returns 8 Jan instead of 1 Aug.
  // Try the DD/MM/YYYY form first so slash/dash dates parse correctly,
  // and only fall back to native parsing for unambiguous formats
  // (ISO "2026-08-15", "15 Aug 2026", etc).
  const match = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (match) {
    const [, d, m, y] = match;
    const year = y.length === 2 ? `20${y}` : y;
    const parsed = new Date(`${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const native = new Date(value);
  if (!Number.isNaN(native.getTime())) return native;

  return null;
}

// Maps arbitrary bank/UPI CSV export rows to { date, title, amount, type }.
// Supports either a single signed "Amount" column or separate Debit/Credit
// columns, which covers most Indian bank statement exports.
export function mapBankRows(rows) {
  if (!rows.length) return [];
  const headers = Object.keys(rows[0]);
  const lower = headers.map((h) => h.toLowerCase());

  const dateKey = headers[lower.findIndex((h) => DATE_KEYS.includes(h))];
  const descKey = headers[lower.findIndex((h) => DESC_KEYS.includes(h))];
  const debitKey = headers[lower.findIndex((h) => DEBIT_KEYS.includes(h))];
  const creditKey = headers[lower.findIndex((h) => CREDIT_KEYS.includes(h))];
  const amountKey = headers[lower.findIndex((h) => AMOUNT_KEYS.includes(h))];

  return rows
    .map((row) => {
      const date = dateKey ? parseDate(row[dateKey]) : null;
      const title = descKey ? row[descKey] : "Imported transaction";

      let amount = 0;
      let type = "expense";

      if (debitKey || creditKey) {
        const debit = debitKey ? parseAmount(row[debitKey]) : 0;
        const credit = creditKey ? parseAmount(row[creditKey]) : 0;
        if (credit > 0) {
          amount = credit;
          type = "income";
        } else {
          amount = debit;
          type = "expense";
        }
      } else if (amountKey) {
        const raw = row[amountKey];
        const negative = raw?.toString().trim().startsWith("-");
        amount = parseAmount(raw);
        type = negative ? "expense" : "income";
      }

      return { date, title: title || "Imported transaction", amount, type };
    })
    .filter((r) => r.date && r.amount > 0);
}
