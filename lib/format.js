export function formatCurrency(amount) {
  const value = Number(amount) || 0;
  const sign = value < 0 ? "-" : "";
  return `${sign}₹${Math.abs(value).toLocaleString("en-IN")}`;
}

export function formatCurrencyPrecise(amount) {
  const value = Number(amount) || 0;
  const sign = value < 0 ? "-" : "";
  return `${sign}₹${Math.abs(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date, opts = { day: "numeric", month: "long", year: "numeric" }) {
  return new Date(date).toLocaleDateString("en-IN", opts);
}

export function formatDateShort(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${d.getFullYear()}`;
}

export function daysSince(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today - start) / 86400000));
}

export function ordinal(day) {
  if (!day) return null;
  const s = ["th", "st", "nd", "rd"];
  const v = day % 100;
  return day + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function userUpiId(name) {
  const handle = (name || "user")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20) || "user";
  return `${handle}@upi`;
}
