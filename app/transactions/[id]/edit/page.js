import { notFound } from "next/navigation";
import Screen from "@/components/Screen";
import TransactionForm from "@/components/TransactionForm";
import { requireUserId } from "@/lib/session";
import { getTransactionById, getCategories, getAccounts } from "@/lib/data";
import { updateTransaction } from "@/lib/actions/transactions";

export default async function EditTransactionPage({ params }) {
  const { id } = await params;
  const userId = await requireUserId();
  const [transaction, categories, accounts] = await Promise.all([
    getTransactionById(userId, id),
    getCategories(userId),
    getAccounts(userId),
  ]);
  if (!transaction) notFound();

  const action = updateTransaction.bind(null, id);

  return (
    <Screen withNav={false}>
      <TransactionForm
        action={action}
        categories={categories}
        accounts={accounts}
        cancelHref={`/transactions/${id}`}
        submitLabel="Save Changes"
        defaults={{
          type: transaction.type,
          amount: transaction.amount,
          title: transaction.title,
          categoryId: transaction.categoryId?._id,
          accountId: transaction.accountId?._id,
          method: transaction.method,
          date: new Date(transaction.date).toISOString().slice(0, 10),
          description: transaction.description,
          tags: transaction.tags,
        }}
      />
    </Screen>
  );
}
