import { notFound } from "next/navigation";
import Screen from "@/components/Screen";
import ScreenHeader from "@/components/ScreenHeader";
import ImportStatementFlow from "@/components/ImportStatementFlow";
import { requireUserId } from "@/lib/session";
import { getAccountById } from "@/lib/data";

export default async function ImportStatementPage({ params }) {
  const { id } = await params;
  const userId = await requireUserId();
  const account = await getAccountById(userId, id);
  if (!account) notFound();

  return (
    <Screen withNav={false}>
      <ScreenHeader title="Import Statement" subtitle={account.name} />
      <ImportStatementFlow accountId={id} />
    </Screen>
  );
}
