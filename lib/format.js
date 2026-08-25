export function formatCurrency(amount) {
  const value = Number(amount) || 0;
  const sign = value < 0 ? "-" : "";
  return `${sign}₹${Math.abs(value).toLocaleString("en-IN")}`;
}

export function formatDate(date, opts = { day: "numeric", month: "long", year: "numeric" }) {
  return new Date(date).toLocaleDateString("en-IN", opts);
}

export function userUpiId(name) {
  const handle = (name || "user")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20) || "user";
  return `${handle}@upi`;
}
