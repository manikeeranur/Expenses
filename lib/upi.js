// Shared UPI helpers used by both the browser (QR scan parsing, client-side
// validation before submit) and server actions (authoritative validation +
// building the final upi://pay link). Keeping one copy avoids the frontend
// and backend checks drifting apart.
//
// IMPORTANT — payment verification limitation: NPCI's person-to-person UPI
// intent flow (the upi://pay deep link) has no callback, webhook, or status
// API that reports back whether the bank actually approved a payment. Once
// this app hands off to the UPI app, it has no further visibility. Every
// "paid" status in this feature is therefore the USER's own self-report
// ("yes, I completed it in my UPI app"), not a bank-verified confirmation.
// This is a hard limitation of the open UPI intent flow, not a gap in this
// code — a bank-verified status would require a registered PSP integration
// (e.g. Razorpay Collect/Orders, already used elsewhere in this app for
// /pay/add-money and /pay/scan), which cannot pay an arbitrary third-party
// UPI ID the way this feature needs to.

const UPI_ID_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,64}$/;

// Statuses that mean "not actually money spent yet" — excluded from
// dashboard/category/report totals until the user confirms the payment.
export const UNSETTLED_UPI_STATUSES = ["initiated", "pending", "cancelled"];

// Debug tracing so a scanned QR can be compared field-by-field against the
// URI we actually hand to the UPI app. On by default outside production, but
// ALSO turns on in production when NEXT_PUBLIC_UPI_DEBUG=1 is set — a plain
// `NODE_ENV !== "production"` check is useless once you're debugging an
// issue that only reproduces on the real Vercel deployment, since Vercel
// always sets NODE_ENV=production there.
export const UPI_DEBUG = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_UPI_DEBUG === "1";

export function logUpiDebug(stage, data) {
  if (!UPI_DEBUG) return;
  console.log(`[upi:${stage}]`, data);
}

// Every parameter present in a upi://pay URI, not just the ones this app
// knows about (pa/pn/am/…) — for debugging a QR that carries mode, purpose,
// orgid, sign, refUrl, or anything else NPCI/a bank/PSP might add. Read-only:
// used for inspection and diffing, never for reconstructing a URI.
//
// Deliberately hand-rolled instead of `new URLSearchParams(query)`: that
// decodes "+" as a space (form-urlencoded semantics), which would make this
// debugging helper itself display a "sign"/base64 field as corrupted even
// when the actual launched URI is untouched — the same class of bug this
// file exists to prevent. decodeURIComponent leaves a literal "+" alone.
export function getAllUpiParams(uri) {
  if (typeof uri !== "string") return {};
  const query = uri.includes("?") ? uri.slice(uri.indexOf("?") + 1) : uri;
  const out = {};
  if (!query) return out;
  for (const pair of query.split("&")) {
    if (!pair) continue;
    const eqIndex = pair.indexOf("=");
    const rawKey = eqIndex === -1 ? pair : pair.slice(0, eqIndex);
    const rawValue = eqIndex === -1 ? "" : pair.slice(eqIndex + 1);
    try {
      out[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue);
    } catch {
      out[rawKey] = rawValue;
    }
  }
  return out;
}

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

  const parsed = {
    pa,
    pn: sanitizeUpiText(params.get("pn"), 100),
    am,
    mam: sanitizeUpiText(params.get("mam"), 20) || null,
    cu: sanitizeUpiText(params.get("cu"), 10) || null,
    tn: sanitizeUpiText(params.get("tn"), 200),
    tr: sanitizeUpiText(params.get("tr"), 100),
    mc: sanitizeUpiText(params.get("mc"), 20) || null,
    // The untouched original link. Real merchant QR codes often carry extra
    // fields (mc, orgid, sign, mode…) that GPay/the bank use to recognize a
    // trusted, already-verified payee. Rebuilding a link from only pa/pn/am
    // drops that context and makes the bank treat it as a brand-new,
    // unverified payee — which is what triggers "exceeded bank limit"
    // rejections that don't happen when the same QR is scanned natively.
    raw: `upi://pay?${query}`,
  };

  logUpiDebug("parsed", parsed);
  return parsed;
}

// For a payee typed in by hand (no QR). No "am"/"tr": Google Pay asks for
// the amount on its own screen, the same as paying a UPI ID inside the app.
// pa needs no escaping — isValidUpiId only allows URL-safe characters.
export function buildUpiUri({ payeeUpiId, payeeName }) {
  return `upi://pay?pa=${payeeUpiId}&pn=${encodeURIComponent(payeeName || payeeUpiId)}&cu=INR`;
}

// Google Pay's own URL scheme. Only Google Pay handles it, so Android opens
// it directly with no "open with" chooser. (An intent://…;package=… link was
// tried instead and opened nothing from Chrome on the user's phone.)
//
// For a scanned QR, `upiUri` must be the QR's own text, untouched: no
// "am"/"cu" appended and never round-tripped through URLSearchParams (which
// turns a "+" in a base64 "sign" into a space). Any change to those bytes
// breaks a signed merchant QR, and Google Pay declines it with a misleading
// "exceeded bank limit" error even though the same QR works when scanned
// inside Google Pay.
export function toGooglePayUrl(upiUri) {
  return `tez://upi/pay?${upiUri.slice(upiUri.indexOf("?") + 1)}`;
}

export function generateUpiReference() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PAY-${datePart}-${rand}`;
}
