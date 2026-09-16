import Screen from "@/components/Screen";
import SettleFlow from "@/components/upi/SettleFlow";
import { requireUserId } from "@/lib/session";
import { getOndemandSettlements } from "@/lib/razorpay-data";

export default async function SettlePage() {
  await requireUserId();
  const settlements = await getOndemandSettlements();

  return (
    <Screen wide>
      <SettleFlow settlements={settlements} />
    </Screen>
  );
}
