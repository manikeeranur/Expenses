import { formatCurrencyPrecise, ordinal } from "@/lib/format";

export function computeLendingStats(lending) {
  const totalInterest = lending.payments.filter((p) => p.type === "interest").reduce((s, p) => s + p.amount, 0);
  const totalPrincipalRepaid = lending.payments.filter((p) => p.type === "principal").reduce((s, p) => s + p.amount, 0);
  const outstanding = Math.max(0, lending.principal - totalPrincipalRepaid);
  const expectedMonthlyInterest = Math.round((outstanding * (lending.interestRatePercent || 0)) / 100);
  return { totalInterest, totalPrincipalRepaid, outstanding, expectedMonthlyInterest };
}

export function buildReminderMessage(lending, stats) {
  const dueLine = lending.interestDueDay ? ` on the ${ordinal(lending.interestDueDay)} of this month` : "";
  return (
    `Hi ${lending.borrower}, this is a reminder that your interest payment of ` +
    `${formatCurrencyPrecise(stats.expectedMonthlyInterest)} is due${dueLine}. ` +
    `Outstanding principal: ${formatCurrencyPrecise(stats.outstanding)}. Thank you!`
  );
}
