import { notFound } from "next/navigation";
import Link from "next/link";
import { Upload, Landmark } from "lucide-react";
import Screen from "@/components/Screen";
import ScreenHeader from "@/components/ScreenHeader";
import TransactionRow from "@/components/TransactionRow";
import DeleteButton from "@/components/ui/DeleteButton";
import { getIcon } from "@/lib/icons";
import { formatCurrency } from "@/lib/format";
import { requireUserId } from "@/lib/session";
import { getAccountById, getTransactions } from "@/lib/data";
import { deleteAccount } from "@/lib/actions/accounts";

export default async function AccountDetailsPage({ params }) {
  const { id } = await params;
  const userId = await requireUserId();
  const account = await getAccountById(userId, id);
  if (!account) notFound();

  const transactions = await getTransactions(userId, { accountId: id });
  const Icon = getIcon(account.type.includes("Credit") ? "CreditCard" : account.type === "Cash" ? "Wallet2" : "Landmark");
  const negative = account.balance < 0;
  const deleteWithId = deleteAccount.bind(null, id);

  return (
    <Screen withNav={false}>
      <ScreenHeader title={account.name} />

      <div className="px-5 pt-4">
        <div className="rounded-2xl p-5 text-white shadow-lg" style={{ backgroundColor: account.color }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon size={18} />
              <span className="text-sm font-semibold">{account.bankName || account.name}</span>
            </div>
            {account.last4 ? <span className="text-xs text-white/80">•••• {account.last4}</span> : null}
          </div>
          <p className="mt-4 text-2xl font-bold">
            {negative ? "-" : ""}
            {formatCurrency(Math.abs(account.balance))}
          </p>
          <p className="mt-1 text-xs text-white/80">{account.type}</p>
          {account.ifsc ? <p className="mt-3 text-xs text-white/70">IFSC {account.ifsc}</p> : null}
        </div>

        <Link
          href={`/accounts/${id}/import`}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3.5 text-sm font-medium text-muted"
        >
          <Upload size={16} />
          Import Statement (CSV)
        </Link>

        <div className="mt-5">
          <h2 className="text-sm font-semibold">Transactions</h2>
          <div className="mt-3 space-y-2.5">
            {transactions.length ? (
              transactions.map((t) => <TransactionRow key={t._id} transaction={t} />)
            ) : (
              <div className="flex flex-col items-center rounded-2xl bg-surface p-8 text-center shadow-sm shadow-black/[0.03]">
                <Landmark size={28} className="text-muted" />
                <p className="mt-3 text-sm font-medium">No transactions yet</p>
                <p className="mt-1 text-xs text-muted">Add one manually or import a bank statement.</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <DeleteButton action={deleteWithId} variant="block" label="Delete Account" confirmText="Delete this account? Its transactions will be kept but unlinked." />
        </div>
      </div>
    </Screen>
  );
}
