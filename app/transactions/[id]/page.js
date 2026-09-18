import { notFound } from "next/navigation";
import Link from "next/link";
import { FileImage, Landmark, CreditCard, Tag as TagIcon, QrCode, Hash, Clock } from "lucide-react";
import Screen from "@/components/Screen";
import ScreenHeader from "@/components/ScreenHeader";
import CategoryIcon from "@/components/ui/CategoryIcon";
import Tag from "@/components/ui/Tag";
import DeleteButton from "@/components/ui/DeleteButton";
import ConfirmUpiPaymentInline from "@/components/upi/ConfirmUpiPaymentInline";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { requireUserId } from "@/lib/session";
import { getTransactionById } from "@/lib/data";
import { deleteTransaction } from "@/lib/actions/transactions";

export default async function TransactionDetailsPage({ params }) {
  const { id } = await params;
  const userId = await requireUserId();
  const transaction = await getTransactionById(userId, id);
  if (!transaction) notFound();

  const isIncome = transaction.type === "income";
  const category = transaction.categoryId;
  const deleteWithId = deleteTransaction.bind(null, id);

  return (
    <Screen withNav={false}>
      <ScreenHeader title={transaction.title} />

      <div className="px-5 pt-4">
        <div className="flex flex-col items-center rounded-2xl bg-surface p-6 shadow-sm shadow-black/[0.03]">
          <CategoryIcon icon={isIncome ? "Landmark" : category?.icon} color={isIncome ? "#21C37E" : category?.color || "#9AA0B4"} size="lg" />
          <p className={`mt-3 text-2xl font-bold ${isIncome ? "text-success" : "text-foreground"}`}>
            {isIncome ? "+" : "-"}
            {formatCurrency(transaction.amount)}
          </p>
          <p className="mt-1 text-xs text-muted">{formatDateShort(transaction.date)}</p>
        </div>

        <div className="mt-4 divide-y divide-border rounded-2xl bg-surface shadow-sm shadow-black/[0.03]">
          <Row icon={<Landmark size={16} className="text-primary" />} label="Account" value={transaction.accountId?.name || "—"} />
          <Row icon={<CreditCard size={16} className="text-primary" />} label="Payment Method" value={transaction.method || "—"} />
          <Row icon={<TagIcon size={16} className="text-primary" />} label="Category" value={isIncome ? "Income" : category?.name || "Uncategorized"} />
          {transaction.upiId ? <Row icon={<QrCode size={16} className="text-primary" />} label="UPI ID" value={transaction.upiId} /> : null}
          {transaction.reference ? <Row icon={<Hash size={16} className="text-primary" />} label="Reference No." value={transaction.reference} /> : null}
          {transaction.paymentStatus ? (
            <Row
              icon={<Clock size={16} className="text-primary" />}
              label="Payment Status"
              value={
                <span
                  className={
                    transaction.paymentStatus === "paid"
                      ? "text-success"
                      : transaction.paymentStatus === "cancelled"
                      ? "text-danger"
                      : "text-warning"
                  }
                >
                  {transaction.paymentStatus === "paid"
                    ? "Paid"
                    : transaction.paymentStatus === "cancelled"
                    ? "Cancelled"
                    : "Pending"}
                </span>
              }
            />
          ) : null}
          {transaction.bankReferenceNumber ? (
            <Row icon={<Hash size={16} className="text-primary" />} label="UTR / Bank Ref." value={transaction.bankReferenceNumber} />
          ) : null}
          {transaction.failureReason ? (
            <Row icon={<Hash size={16} className="text-primary" />} label="Reason" value={transaction.failureReason} />
          ) : null}
        </div>

        {transaction.paymentStatus ? (
          <p className="mt-2 px-1 text-[11px] text-muted">
            Status is self-reported — UPI person-to-person payments have no bank verification callback this app can check.
          </p>
        ) : null}

        {["initiated", "pending"].includes(transaction.paymentStatus) ? (
          <ConfirmUpiPaymentInline transactionId={transaction._id} />
        ) : null}

        {transaction.description ? (
          <div className="mt-4 rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
            <p className="text-xs text-muted">Description</p>
            <p className="mt-1 text-sm">{transaction.description}</p>
          </div>
        ) : null}

        {transaction.tags?.length ? (
          <div className="mt-4 rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
            <p className="text-xs text-muted">Tags</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {transaction.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          </div>
        ) : null}

        {transaction.receiptName ? (
          <div className="mt-4 rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
            <p className="text-xs text-muted">Receipt</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
                <FileImage size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{transaction.receiptName}</p>
                <p className="text-xs text-muted">{transaction.receiptSize}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link href={`/transactions/${id}/edit`} className="flex items-center justify-center rounded-2xl border border-border py-3.5 text-sm font-semibold">
            Edit
          </Link>
          <DeleteButton action={deleteWithId} variant="block" label="Delete" confirmText="Delete this transaction?" />
        </div>
      </div>
    </Screen>
  );
}

function Row({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light">{icon}</span>
      <span className="flex-1 text-sm text-muted">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
