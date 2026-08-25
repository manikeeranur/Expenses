import Screen from "@/components/Screen";
import ScreenHeader from "@/components/ScreenHeader";
import ExportForm from "@/components/ExportForm";
import { requireUserId } from "@/lib/session";
import { getTransactions } from "@/lib/data";

export default async function ExportReportPage() {
  const userId = await requireUserId();
  const transactions = await getTransactions(userId);

  return (
    <Screen withNav={false}>
      <ScreenHeader title="Export Report" />
      <ExportForm transactions={transactions} />
    </Screen>
  );
}
