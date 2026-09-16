import Screen from "@/components/Screen";
import SendMoneyFlow from "@/components/upi/SendMoneyFlow";
import { requireUserId } from "@/lib/session";
import { getRecentUpiContacts } from "@/lib/data";

export default async function SendMoneyPage() {
  const userId = await requireUserId();
  const contacts = await getRecentUpiContacts(userId);

  return (
    <Screen wide>
      <SendMoneyFlow contacts={contacts} />
    </Screen>
  );
}
