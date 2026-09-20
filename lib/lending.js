import { formatCurrencyPrecise, ordinal } from "@/lib/format";

export function computeLendingStats(lending) {
  const totalInterest = lending.payments.filter((p) => p.type === "interest").reduce((s, p) => s + p.amount, 0);
  const totalPrincipalRepaid = lending.payments.filter((p) => p.type === "principal").reduce((s, p) => s + p.amount, 0);
  const outstanding = Math.max(0, lending.principal - totalPrincipalRepaid);
  const expectedMonthlyInterest = Math.round((outstanding * (lending.interestRatePercent || 0)) / 100);
  return { totalInterest, totalPrincipalRepaid, outstanding, expectedMonthlyInterest };
}

// Next occurrence of the lending's interestDueDay, and how many days from
// today that is (negative = overdue). Days are capped at 28 to stay valid
// across every month (Feb has no 29th-31st).
export function getNextDueInfo(lending) {
  if (lending.status === "closed" || !lending.interestDueDay) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = Math.min(lending.interestDueDay, 28);
  let due = new Date(today.getFullYear(), today.getMonth(), day);
  if (due < today) due = new Date(today.getFullYear(), today.getMonth() + 1, day);
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
