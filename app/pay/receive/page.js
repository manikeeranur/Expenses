import Screen from "@/components/Screen";
import ReceiveMoneyFlow from "@/components/upi/ReceiveMoneyFlow";
import { requireUserId } from "@/lib/session";
import { getRecentUpiContacts, getUser } from "@/lib/data";
import { userUpiId } from "@/lib/format";

export default async function ReceiveMoneyPage() {
  const userId = await requireUserId();
  const [contacts, user] = await Promise.all([getRecentUpiContacts(userId), getUser(userId)]);

  return (
    <Screen wide>
      <ReceiveMoneyFlow contacts={contacts} myUpiId={userUpiId(user?.name)} />
    </Screen>
  );
}
