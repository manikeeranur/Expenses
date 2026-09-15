import { notFound } from "next/navigation";
import {
  HandCoins,
  IndianRupee,
  Coins,
  Percent,
  CalendarClock,
  CalendarDays,
  BarChart3,
  Info,
  Landmark,
} from "lucide-react";
import Screen from "@/components/Screen";
import Tag from "@/components/ui/Tag";
import CircularProgress from "@/components/ui/CircularProgress";
import InterestPaymentsChart from "@/components/charts/InterestPaymentsChart";
import LendingDetailHeader from "@/components/LendingDetailHeader";
import LendingActionsMenu from "@/components/LendingActionsMenu";
import LendingPaymentForm from "@/components/LendingPaymentForm";
import LendingForm from "@/components/LendingForm";
import EditPaymentForm from "@/components/EditPaymentForm";
import DeleteButton from "@/components/ui/DeleteButton";
import SendReminderButton from "@/components/SendReminderButton";
import { formatCurrencyPrecise, formatDate, formatDateShort, daysSince, ordinal } from "@/lib/format";
import { requireUserId } from "@/lib/session";
import { getLendingById } from "@/lib/data";
import {
  addPayment,
  updateLending,
  updatePayment,
  deletePayment,
  setLendingStatus,
  deleteLending,
  sendReminder,
} from "@/lib/actions/lending";

function StatCard({ icon, tone, label, value, valueClassName = "" }) {
  const tones = {
    success: "bg-success-light text-success",
    warning: "bg-warning-light text-warning",
    primary: "bg-primary-light text-primary",
    info: "bg-info-light text-info",
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

function PaymentTable({ id, icon, title, totalLabel, totalTone, payments, emptyLabel }) {
  const total = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
          {icon}
        </span>
        <h2 className="flex-1 text-sm font-bold">{title}</h2>
        <span className="flex items-center gap-2 rounded-full bg-background px-3 py-1.5">
          <span className="text-[11px] text-muted">{totalLabel}</span>
          <span className={`text-xs font-bold ${totalTone}`}>{formatCurrencyPrecise(total)}</span>
        </span>
      </div>

      {payments.length ? (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-[11px] font-medium text-muted">Date</th>
                <th className="pb-2 text-[11px] font-medium text-muted">Type</th>
                <th className="pb-2 text-right text-[11px] font-medium text-muted">Amount</th>
                <th className="pb-2 text-right text-[11px] font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map((p) => (
                <tr key={p.index}>
                  <td className="py-3 text-sm text-muted">
                    {formatDateShort(p.date)}
                    {p.remarks ? <span className="block text-[11px] text-muted">{p.remarks}</span> : null}
                  </td>
                  <td className="py-3">
                    <Tag tone={p.type === "principal" ? "info" : "primary"}>
                      {p.type === "principal" ? "Principal" : "Interest"}
                    </Tag>
                    <span className="ml-1 text-[11px] text-muted">{p.method === "upi" ? "UPI" : "Cash"}</span>
                  </td>
                  <td className="py-3 text-right text-sm font-semibold text-success">
                    +{formatCurrencyPrecise(p.amount)}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <EditPaymentForm action={updatePayment.bind(null, id, p.index)} defaults={p} />
                      <DeleteButton
                        action={deletePayment.bind(null, id, p.index)}
                        variant="outline"
                        label="Delete payment"
                        confirmText="Delete this payment?"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-3 rounded-xl bg-background p-4 text-center text-xs text-muted">{emptyLabel}</p>
      )}
    </div>
  );
}

export default async function LendingDetailsPage({ params }) {
  const { id } = await params;
  const userId = await requireUserId();
  const lending = await getLendingById(userId, id);
  if (!lending) notFound();

  const interestPayments = lending.payments.filter((p) => p.type === "interest");
  const principalPayments = lending.payments.filter((p) => p.type === "principal");
  const totalInterest = interestPayments.reduce((s, p) => s + p.amount, 0);
  const totalPrincipalRepaid = principalPayments.reduce((s, p) => s + p.amount, 0);
  const outstanding = Math.max(0, lending.principal - totalPrincipalRepaid);
  const expectedMonthlyInterest = Math.round((outstanding * (lending.interestRatePercent || 0)) / 100);
  const repaidPct = lending.principal > 0 ? Math.round((totalPrincipalRepaid / lending.principal) * 100) : 0;

  const chartData = [...interestPayments]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-8)
    .map((p) => ({ label: formatDate(p.date, { day: "numeric", month: "short" }), value: p.amount }));

  const paymentsWithIndex = lending.payments
    .map((p, index) => ({ ...p, index }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const interestHistory = paymentsWithIndex.filter((p) => p.type === "interest");
  const principalHistory = paymentsWithIndex.filter((p) => p.type === "principal");

  const paymentAction = addPayment.bind(null, id);
  const editAction = updateLending.bind(null, id);
  const statusAction = setLendingStatus.bind(null, id, lending.status === "closed" ? "active" : "closed");
  const deleteWithId = deleteLending.bind(null, id);
  const reminderAction = sendReminder.bind(null, id);
  const lastReminder = lending.reminders?.[0];

  return (
    <Screen wide>
      <LendingDetailHeader
        initial={lending.borrower.charAt(0).toUpperCase()}
        title={lending.borrower}
        subtitle={`Given on ${formatDateShort(lending.dateGiven)} • ${lending.mobile || "No mobile number"}`}
      >
        <Tag tone={lending.status === "closed" ? "neutral" : "success"}>
          {lending.status === "closed" ? "Closed" : "Active"}
        </Tag>
        <LendingActionsMenu
          isClosed={lending.status === "closed"}
          statusAction={statusAction}
          deleteAction={deleteWithId}
          editSlot={<LendingForm action={editAction} defaults={lending} variant="menu" />}
          reminderSlot={
            <SendReminderButton
              action={reminderAction}
              variant="menu"
              lastReminder={
                lastReminder ? `Last sent ${formatDateShort(lastReminder.date)} · ${lastReminder.status}` : undefined
              }
            />
          }
        />
      </LendingDetailHeader>


      <div className="space-y-4 px-4 pb-4">
        <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-4 text-white shadow-xl">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <HandCoins size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white/75">Outstanding Principal</p>
            <p className="mt-1 text-2xl font-bold">{formatCurrencyPrecise(outstanding)}</p>
            <p className="mt-1 text-xs text-white/75">of {formatCurrencyPrecise(lending.principal)} principal (Asal)</p>
          </div>
          <CircularProgress value={repaidPct} size={84} strokeWidth={8} color="#21c37e">
            <span className="text-center">
              <span className="block text-base font-bold">{repaidPct}%</span>
              <span className="block text-[10px] text-white/75">Repaid</span>
            </span>
          </CircularProgress>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={<IndianRupee size={18} />}
            tone="success"
            label="Principal Paid"
            value={formatCurrencyPrecise(totalPrincipalRepaid)}
          />
          <StatCard
            icon={<Coins size={18} />}
            tone="warning"
            label="Interest Collected So Far"
            value={formatCurrencyPrecise(totalInterest)}
            valueClassName="text-success"
          />
          <StatCard
            icon={<Percent size={18} />}
            tone="primary"
            label="Interest Rate"
            value={`${lending.interestRatePercent || 0}% month`}
          />
          <StatCard
            icon={<CalendarClock size={18} />}
            tone="info"
            label="Days Since Given"
            value={`${daysSince(lending.dateGiven)} days`}
          />
          <StatCard
            icon={<CalendarDays size={18} />}
            tone="info"
            label="Interest Due Day"
            value={lending.interestDueDay ? `${ordinal(lending.interestDueDay)} of every month` : "Not set"}
          />
          <StatCard
            icon={<BarChart3 size={18} />}
            tone="primary"
            label="Expected Monthly Interest"
            value={formatCurrencyPrecise(expectedMonthlyInterest)}
          />
        </div>

        {lending.note ? (
          <div className="flex gap-4 rounded-2xl border border-info/20 bg-info-light p-4">
            <Info size={18} className="mt-0.5 shrink-0 text-info" />
            <p className="text-sm text-foreground/80">{lending.note}</p>
          </div>
        ) : null}

        <LendingPaymentForm action={paymentAction} />

        <PaymentTable
          id={id}
          icon={<Coins size={17} />}
          title="Interest Payments"
          totalLabel="Total Collected"
          totalTone="text-success"
          payments={interestHistory}
          emptyLabel="No interest payments logged yet."
        />

        <PaymentTable
          id={id}
          icon={<Landmark size={17} />}
          title="Principal Payments"
          totalLabel="Total Paid"
          totalTone="text-info"
          payments={principalHistory}
          emptyLabel="No principal payments logged yet."
        />

        <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
              <BarChart3 size={17} />
            </span>
            <h2 className="flex-1 text-sm font-bold">Balance Overview</h2>
            <span className="flex items-center gap-4 text-[11px] text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                Principal Paid
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary-light" />
                Outstanding
              </span>
            </span>
          </div>

          <div className="mt-4 flex h-10 w-full overflow-hidden rounded-xl bg-primary-light">
            {repaidPct > 0 ? (
              <div
                className="flex items-center justify-start bg-primary px-4 text-xs font-semibold text-white"
                style={{ width: `${repaidPct}%` }}
              >
                {repaidPct >= 20 ? formatCurrencyPrecise(totalPrincipalRepaid).replace(".00", "") : null}
              </div>
            ) : null}
            <div className="flex flex-1 items-center justify-end px-4 text-xs font-semibold text-primary-dark">
              {100 - repaidPct >= 20 ? formatCurrencyPrecise(outstanding).replace(".00", "") : null}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 divide-x divide-border text-center">
            <div className="px-2">
              <p className="text-[11px] text-muted">Total Principal</p>
              <p className="mt-1 text-sm font-bold">{formatCurrencyPrecise(lending.principal)}</p>
            </div>
            <div className="px-2">
              <p className="text-[11px] text-muted">Paid ({repaidPct}%)</p>
              <p className="mt-1 text-sm font-bold">{formatCurrencyPrecise(totalPrincipalRepaid)}</p>
            </div>
            <div className="px-2">
              <p className="text-[11px] text-muted">Outstanding ({100 - repaidPct}%)</p>
              <p className="mt-1 text-sm font-bold text-primary">{formatCurrencyPrecise(outstanding)}</p>
            </div>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
            <h2 className="text-sm font-bold">Interest Payments Over Time</h2>
            <div className="mt-4">
              <InterestPaymentsChart data={chartData} />
            </div>
          </div>
        ) : null}
      </div>
    </Screen>
  );
}
