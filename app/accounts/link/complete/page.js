import { redirect } from "next/navigation";
import Screen from "@/components/Screen";
import BankLinkStatusFlow from "@/components/BankLinkStatusFlow";
import { requireUserId } from "@/lib/session";
import { getLatestBankLink } from "@/lib/data";

export default async function BankLinkCompletePage() {
  const userId = await requireUserId();
  const link = await getLatestBankLink(userId);
  if (!link) redirect("/accounts/link");

  return (
    <Screen wide>
      <BankLinkStatusFlow link={link} />
    </Screen>
  );
}
