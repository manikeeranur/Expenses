import Screen from "@/components/Screen";
import LinkBankFlow from "@/components/upi/LinkBankFlow";

export default function LinkBankPage() {
  return (
    <Screen withNav={false}>
      <LinkBankFlow />
    </Screen>
  );
}
