import Screen from "@/components/Screen";
import ScanToPayFlow from "@/components/upi/ScanToPayFlow";
import { requireUserId } from "@/lib/session";
import { getActiveQrCode, getQrPayments } from "@/lib/data";

export default async function ScanToPayPage() {
  const userId = await requireUserId();
  const activeQr = await getActiveQrCode(userId);
  const payments = activeQr ? await getQrPayments(userId, activeQr.razorpayQrCodeId) : [];

  return (
    <Screen withNav={false}>
      <ScanToPayFlow activeQr={activeQr} payments={payments} />
    </Screen>
  );
}
