// Shared UPI helpers used by both the browser (QR scan parsing, client-side
// validation before submit) and server actions (authoritative validation +
// building the final upi://pay link). Keeping one copy avoids the frontend
// and backend checks drifting apart.

const UPI_ID_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,64}$/;

// Statuses that mean "not actually money spent yet" — excluded from
// dashboard/category/report totals until the user confirms the payment.
export const UNSETTLED_UPI_STATUSES = ["initiated", "pending", "cancelled"];

export function isValidUpiId(value) {
  return typeof value === "string" && UPI_ID_REGEX.test(value.trim());
}

export function sanitizeUpiText(value, maxLen = 100) {
  if (!value) return "";
  return value
    .toString()
    .replace(/[\r\n\t<>]/g, "")
    .trim()
    .slice(0, maxLen);
}

// Accepts either a full "upi://pay?..." deep link or a bare query string
// (some QR generators encode just "pa=...&pn=...&am=..."). Returns null for
// anything that isn't a recognizable UPI payment intent.
export function parseUpiUri(raw) {
  if (!raw || typeof raw !== "string") return null;
  const text = raw.trim();
  const looksLikeUpi = /^upi:\/\/pay\??/i.test(text) || /(^|&)pa=/i.test(text);
  if (!looksLikeUpi) return null;

  const query = text.includes("?") ? text.slice(text.indexOf("?") + 1) : text;
  let params;
  try {
    params = new URLSearchParams(query);
  } catch {
    return null;
  }

  const pa = sanitizeUpiText(params.get("pa"), 100);
  if (!isValidUpiId(pa)) return null;

  const amRaw = params.get("am");
  const am = amRaw && !Number.isNaN(Number(amRaw)) && Number(amRaw) > 0 ? Number(amRaw) : null;

  return {
    pa,
    pn: sanitizeUpiText(params.get("pn"), 100),
    am,
    tn: sanitizeUpiText(params.get("tn"), 200),
    tr: sanitizeUpiText(params.get("tr"), 100),
    // The untouched original link. Real merchant QR codes often carry extra
    // fields (mc, orgid, sign, mode…) that GPay/the bank use to recognize a
    // trusted, already-verified payee. Rebuilding a link from only pa/pn/am
    // drops that context and makes the bank treat it as a brand-new,
    // unverified payee — which is what triggers "exceeded bank limit"
    // rejections that don't happen when the same QR is scanned natively.
    raw: `upi://pay?${query}`,
  };
}

export function buildUpiUri({ payeeUpiId, payeeName, amount, note, reference }) {
  const params = new URLSearchParams();
  params.set("pa", payeeUpiId);
  params.set("pn", payeeName || payeeUpiId);
  params.set("am", Number(amount).toFixed(2));
  params.set("cu", "INR");
  if (note) params.set("tn", note);
  params.set("tr", reference);
  return `upi://pay?${params.toString()}`;
}

// For a payment that started from a scanned QR: hand the UPI app the exact
// original link, untouched, so any merchant/signature context survives.
// Only fills in "am" when the QR didn't already fix one — editing any field
// on an already-signed intent is exactly what breaks the trust signal above.
export function finalizeScannedUpiUri(scannedRaw, { amount } = {}) {
  const query = scannedRaw.includes("?") ? scannedRaw.slice(scannedRaw.indexOf("?") + 1) : scannedRaw;
  const params = new URLSearchParams(query);
  if (!params.get("am") && amount) params.set("am", Number(amount).toFixed(2));
  if (!params.get("cu")) params.set("cu", "INR");
  return `upi://pay?${params.toString()}`;
}

// Swaps the generic "upi://pay?..." link for a specific app's own scheme —
// GPay, PhonePe, Paytm, BHIM and Amazon Pay all accept the same query
// parameters, they just answer to different custom schemes. Any app not
// listed here (e.g. INDmoney) still registers the generic "upi://" scheme,
// so "Other UPI App" (upi://pay itself) reaches it via the OS's own chooser.
export function buildAppUpiUri(upiUri, scheme) {
  const query = upiUri.includes("?") ? upiUri.slice(upiUri.indexOf("?") + 1) : "";
  return `${scheme}?${query}`;
}

export function generateUpiReference() {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `EXP-UPI-${(time + rand).toUpperCase()}`;
}
