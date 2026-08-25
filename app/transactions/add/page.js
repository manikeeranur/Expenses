import Screen from "@/components/Screen";
import TransactionForm from "@/components/TransactionForm";
import { requireUserId } from "@/lib/session";
import { getCategories, getAccounts } from "@/lib/data";
import { createTransaction } from "@/lib/actions/transactions";

export default async function AddTransactionPage() {
  const userId = await requireUserId();
  const [categories, accounts] = await Promise.all([getCategories(userId), getAccounts(userId)]);

  return (
    <Screen withNav={false}>
      <TransactionForm
        action={createTransaction}
        categories={categories}
        accounts={accounts}
        cancelHref="/transactions"
        submitLabel="Save Transaction"
      />
    </Screen>
  );
}
