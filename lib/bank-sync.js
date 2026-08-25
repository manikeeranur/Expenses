import "server-only";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";

// Shared by the manual "check status" action and the Setu webhook — takes a
// BankLink mongoose document and a data-session response, and upserts the
// real linked Account plus any new real Transactions from it.
export async function syncBankLinkData(link, session) {
  const fipAccounts = session?.data?.accounts || session?.accounts || [];

  for (const fipAccount of fipAccounts) {
    const summary = fipAccount.summary || {};
    const profile = fipAccount.profile?.holders?.holder?.[0] || {};
    const last4 = summary.maskedAccNumber?.slice(-4) || "0000";
    const accountName = `${summary.bank || "Linked Bank"} •••• ${last4}`;

    let account = await Account.findOne({ userId: link.userId, name: accountName });
    if (!account) {
      account = await Account.create({
        userId: link.userId,
        name: accountName,
        type: summary.type || "Savings Account",
        bankName: summary.bank || profile.name || null,
        ifsc: summary.ifscCode || null,
        last4,
        balance: Number(summary.currentBalance) || 0,
        color: "#3AA0FF",
      });
    } else {
      account.balance = Number(summary.currentBalance) || account.balance;
      await account.save();
    }

    link.accountId = account._id;

    const transactions = fipAccount.transactions?.transaction || [];
    for (const t of transactions) {
      const reference = t.txnId || t.transactionId;
      const existing = reference
        ? await Transaction.findOne({ userId: link.userId, accountId: account._id, reference })
        : null;
      if (existing) continue;

      await Transaction.create({
        userId: link.userId,
        title: t.narration || "Bank transaction",
        type: t.type === "CREDIT" ? "income" : "expense",
        amount: Math.abs(Number(t.amount)) || 0,
        accountId: account._id,
        method: "Bank Sync",
        date: new Date(t.valueDate || t.transactionTimestamp || Date.now()),
        description: t.narration || "",
        tags: ["Bank Sync", "Real Account"],
        reference: reference || null,
      });
    }
  }

  link.lastSyncedAt = new Date();
  await link.save();
}
