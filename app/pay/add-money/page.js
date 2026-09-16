import Screen from "@/components/Screen";
import AddMoneyFlow from "@/components/upi/AddMoneyFlow";
import { requireUserId } from "@/lib/session";
import { getUser } from "@/lib/data";

export default async function AddMoneyPage() {
  const userId = await requireUserId();
  const user = await getUser(userId);

  return (
    <Screen wide>
      <AddMoneyFlow userName={user?.name} userEmail={user?.email} />
    </Screen>
  );
}
