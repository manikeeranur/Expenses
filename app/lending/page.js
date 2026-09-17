import { HandCoins, PiggyBank, Coins, BarChart3 } from "lucide-react";
import Screen from "@/components/Screen";
import BottomNav from "@/components/BottomNav";
import Tag from "@/components/ui/Tag";
import ClickableRow from "@/components/ui/ClickableRow";
import LendingBarChart from "@/components/charts/LendingBarChart";
import LendingActionsMenu from "@/components/LendingActionsMenu";
import LendingForm from "@/components/LendingForm";
import SendReminderButton from "@/components/SendReminderButton";
import { formatCurrencyPrecise, formatDateShort, daysSince, ordinal } from "@/lib/format";
import { requireUserId } from "@/lib/session";
import { getLendings } from "@/lib/data";
import { setLendingStatus, deleteLending, sendReminder, updateLending, createLending } from "@/lib/actions/lending";

function summarize(lending) {
  const interest = lending.payments.filter((p) => p.type === "interest").reduce((s, p) => s + p.amount, 0);
  const principalRepaid = lending.payments.filter((p) => p.type === "principal").reduce((s, p) => s + p.amount, 0);
  const outstanding = Math.max(0, lending.principal - principalRepaid);
  const monthlyInterest = Math.round((outstanding * (lending.interestRatePercent || 0)) / 100);
  return { interest, principalRepaid, outstanding, monthlyInterest };
}

function StatCard({ icon, tone, label, value, valueClassName = "" }) {
  const tones = {
    primary: "bg-primary-light text-primary",
    info: "bg-info-light text-info",
    success: "bg-success-light text-success",
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone] || tones.primary}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className={`mt-0.5 text-base font-bold ${valueClassName}`}>{value}</p>
      </div>
    </div>
  );
}

export default async function LendingPage() {
  const userId = await requireUserId();
  const lendings = await getLendings(userId);
  const summaries = lendings.map((l) => ({ ...l, ...summarize(l) }));

  const totalPrincipal = summaries.reduce((s, l) => s + l.principal, 0);
  const totalOutstanding = summaries.reduce((s, l) => s + l.outstanding, 0);
  const totalInterest = summaries.reduce((s, l) => s + l.interest, 0);

  const chartData = summaries.map((l) => ({
    borrower: l.borrower,
    principal: l.principal,
    principalRepaid: l.principalRepaid,
    outstanding: l.outstanding,
    interest: l.interest,
  }));

  return (
    <Screen wide>
      <header className="flex items-center justify-between px-4 pb-2 pt-6 md:hidden">
        <h1 className="text-xl font-bold">Lending</h1>
        <LendingForm action={createLending} mode="create" variant="fab" />
      </header>

      {summaries.length ? (
        <div className="space-y-4 px-4 pt-3 md:px-8 md:pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={<HandCoins size={18} />}
              tone="primary"
              label="Total Given"
              value={formatCurrencyPrecise(totalPrincipal)}
            />
            <StatCard
              icon={<PiggyBank size={18} />}
              tone="info"
              label="Outstanding"
              value={formatCurrencyPrecise(totalOutstanding)}
            />
            <StatCard
              icon={<Coins size={18} />}
              tone="success"
              label="Interest Collected"
              value={formatCurrencyPrecise(totalInterest)}
              valueClassName="text-success"
            />
          </div>

          <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                <BarChart3 size={17} />
              </span>
              <h2 className="text-sm font-bold">Principal vs Interest by Borrower</h2>
            </div>
            <div className="mt-2">
              <LendingBarChart data={chartData} />
            </div>
          </div>

          <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                <HandCoins size={17} />
              </span>
              <h2 className="flex-1 text-sm font-bold">Borrowers</h2>
              <LendingForm action={createLending} mode="create" variant="header" className="hidden md:flex" />
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-[11px] font-medium text-muted">Borrower</th>
                    <th className="pb-2 text-[11px] font-medium text-muted">Principal</th>
                    <th className="pb-2 text-[11px] font-medium text-muted">Principal Paid</th>
                    <th className="pb-2 text-[11px] font-medium text-muted">Outstanding</th>
                    <th className="pb-2 text-[11px] font-medium text-muted">Interest Collected</th>
                    <th className="pb-2 text-[11px] font-medium text-muted">Monthly Due</th>
                    <th className="pb-2 text-[11px] font-medium text-muted">Status</th>
                    <th className="pb-2 text-right text-[11px] font-medium text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {summaries.map((l) => (
                    <ClickableRow key={l._id} href={`/lending/${l._id}`}>
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                            {l.borrower.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{l.borrower}</p>
                            <p className="truncate text-[11px] text-muted">
                              Given {formatDateShort(l.dateGiven)} · {daysSince(l.dateGiven)}d ago
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-sm font-semibold text-danger">{formatCurrencyPrecise(l.principal)}</td>
                      <td className="py-3 text-sm font-semibold text-success">{formatCurrencyPrecise(l.principalRepaid)}</td>
                      <td className="py-3 text-sm font-semibold text-warning">{formatCurrencyPrecise(l.outstanding)}</td>
                      <td className="py-3 text-sm font-semibold text-info">{formatCurrencyPrecise(l.interest)}</td>
                      <td className="py-3 text-sm text-muted">
                        {l.status === "closed" ? (
                          "—"
                        ) : (
                          <>
                            {formatCurrencyPrecise(l.monthlyInterest)}
                            {l.interestDueDay ? (
                              <span className="block text-[11px] text-muted">{ordinal(l.interestDueDay)} of month</span>
                            ) : null}
                          </>
                        )}
                      </td>
                      <td className="py-3">
                        <Tag tone={l.status === "closed" ? "neutral" : "success"}>
                          {l.status === "closed" ? "Closed" : "Active"}
                        </Tag>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end">
                          <LendingActionsMenu
                            isClosed={l.status === "closed"}
                            statusAction={setLendingStatus.bind(null, l._id.toString(), l.status === "closed" ? "active" : "closed")}
                            deleteAction={deleteLending.bind(null, l._id.toString())}
                            editSlot={<LendingForm action={updateLending.bind(null, l._id.toString())} defaults={l} variant="menu" />}
                            reminderSlot={
                              <SendReminderButton action={sendReminder.bind(null, l._id.toString())} variant="menu" />
                            }
                          />
                        </div>
                      </td>
                    </ClickableRow>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center px-8 pt-24 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-light">
            <HandCoins size={40} className="text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="mt-6 text-lg font-bold">No Lending Entries Yet</h2>
          <p className="mt-1 text-sm text-muted">Track money you&apos;ve lent out and the interest collected on it.</p>
          <LendingForm action={createLending} mode="create" variant="empty" />
        </div>
      )}

      <BottomNav />
    </Screen>
  );
}
