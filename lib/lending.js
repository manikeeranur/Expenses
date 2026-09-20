import { formatCurrencyPrecise, ordinal } from "@/lib/format";

export function computeLendingStats(lending) {
  const totalInterest = lending.payments.filter((p) => p.type === "interest").reduce((s, p) => s + p.amount, 0);
  const totalPrincipalRepaid = lending.payments.filter((p) => p.type === "principal").reduce((s, p) => s + p.amount, 0);
  const outstanding = Math.max(0, lending.principal - totalPrincipalRepaid);
  const expectedMonthlyInterest = Math.round((outstanding * (lending.interestRatePercent || 0)) / 100);
  return { totalInterest, totalPrincipalRepaid, outstanding, expectedMonthlyInterest };
}

// The next interest due date that hasn't been settled yet, and how many
// days from today that is (negative = overdue). Days are capped at 28 to
// stay valid across every month (Feb has no 29th-31st).
//
// Deliberately does NOT try to match a payment's date against a specific
// due-date window — a payment made a few days early or late for its cycle
// would get matched to the wrong cycle that way (tried that, it broke: a
// late payment made the "next due" jump an extra month forward). Instead,
// each logged interest payment is simply assumed to settle the next
// unsettled monthly cycle in order, regardless of exactly which day it
// landed on: the Nth interest payment settles month N, so the due date to
// show next is for month (N+1) after dateGiven.
export function getNextDueInfo(lending) {
  if (lending.status === "closed" || !lending.interestDueDay) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = Math.min(lending.interestDueDay, 28);
  const dateGiven = new Date(lending.dateGiven);
  const interestPaymentCount = (lending.payments || []).filter((p) => p.type === "interest").length;

  const due = new Date(dateGiven.getFullYear(), dateGiven.getMonth() + interestPaymentCount + 1, day);
  const diffDays = Math.round((due - today) / 86400000);
  return { due, diffDays };
}

export function buildReminderMessage(lending, stats) {
  const dueLine = lending.interestDueDay ? ` on the ${ordinal(lending.interestDueDay)} of this month` : "";
  return (
    `Hi ${lending.borrower}, this is a reminder that your interest payment of ` +
    `${formatCurrencyPrecise(stats.expectedMonthlyInterest)} is due${dueLine}. ` +
    `Outstanding principal: ${formatCurrencyPrecise(stats.outstanding)}. Thank you!`
  );
}
