import Screen from "@/components/Screen";
import PayViaUpiFlow from "@/components/upi/PayViaUpiFlow";
import { requireUserId } from "@/lib/session";
import { getCategories } from "@/lib/data";

export default async function PayViaUpiPage() {
  const userId = await requireUserId();
  const categories = await getCategories(userId);

  return (
    <Screen withNav={false}>
      <PayViaUpiFlow categories={categories} />
    </Screen>
  );
}
