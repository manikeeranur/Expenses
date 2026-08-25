"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongoose";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import { requireUserId } from "@/lib/session";

export async function createAccount(prevState, formData) {
  const userId = await requireUserId();
  const name = formData.get("name")?.toString().trim();
  const type = formData.get("type")?.toString() || "Savings Account";
  const bankName = formData.get("bankName")?.toString().trim() || null;
  const ifsc = formData.get("ifsc")?.toString().trim().toUpperCase() || null;
  const accountNumber = formData.get("accountNumber")?.toString().trim() || "";
  const last4 = accountNumber ? accountNumber.slice(-4) : null;
  const balance = Number(formData.get("balance")) || 0;
  const color = formData.get("color")?.toString() || "#6C5CE7";

  if (!name) return { error: "Please enter an account name." };

  await dbConnect();
  await Account.create({ userId, name, type, bankName, ifsc, last4, balance, color });

  revalidatePath("/accounts");
  return { success: true };
}

export async function importTransactions(accountId, rows) {
  const userId = await requireUserId();
  if (!Array.isArray(rows) || !rows.length) return { error: "No transactions to import." };

  await dbConnect();
  const account = await Account.findOne({ _id: accountId, userId });
  if (!account) return { error: "Account not found." };

  const docs = rows
    .filter((r) => r.date && r.amount > 0)
    .map((r) => ({
      userId,
      title: r.title?.slice(0, 200) || "Imported transaction",
      type: r.type === "income" ? "income" : "expense",
      amount: r.amount,
      accountId: account._id,
      method: "Bank Statement",
      date: new Date(r.date),
      description: "",
      tags: ["Imported"],
    }));

  if (!docs.length) return { error: "No valid rows to import." };

  await Transaction.insertMany(docs);

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/categories");
  revalidatePath("/budgets");
  revalidatePath("/reports");
  revalidatePath(`/accounts/${accountId}`);
  return { success: true, count: docs.length };
}

export async function deleteAccount(id) {
  const userId = await requireUserId();
  await dbConnect();
  await Account.deleteOne({ _id: id, userId });
  await Transaction.updateMany({ userId, accountId: id }, { accountId: null });
  revalidatePath("/accounts");
  revalidatePath("/transactions");
  redirect("/accounts");
}
