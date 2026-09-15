"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongoose";
import Transaction from "@/models/Transaction";
import Category from "@/models/Category";
import Notification from "@/models/Notification";
import { requireUserId } from "@/lib/session";
import { formatCurrency } from "@/lib/format";
import { getCategories, getAccounts } from "@/lib/data";

export async function getTransactionFormOptions() {
  const userId = await requireUserId();
  const [categories, accounts] = await Promise.all([getCategories(userId), getAccounts(userId)]);
  return { categories, accounts };
}

function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/categories");
  revalidatePath("/budgets");
  revalidatePath("/reports");
  revalidatePath("/reports/trends");
  revalidatePath("/calendar");
}

function readForm(formData) {
  const tagsRaw = formData.get("tags")?.toString() || "";
  return {
    title: formData.get("title")?.toString().trim(),
    type: formData.get("type")?.toString() === "income" ? "income" : "expense",
    amount: Number(formData.get("amount")),
    categoryId: formData.get("categoryId")?.toString() || null,
    accountId: formData.get("accountId")?.toString() || null,
    method: formData.get("method")?.toString() || "",
    date: formData.get("date")?.toString() || new Date().toISOString().slice(0, 10),
    description: formData.get("description")?.toString() || "",
    tags: tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  };
}

async function maybeNotifyBudget(userId, categoryId) {
  if (!categoryId) return;
  const category = await Category.findOne({ _id: categoryId, userId });
  if (!category || !category.budget) return;

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [{ total } = { total: 0 }] = await Transaction.aggregate([
    { $match: { userId, categoryId: category._id, type: "expense", date: { $gte: start, $lt: end } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const pct = (total / category.budget) * 100;
  if (pct < 90) return;

  const recentDupe = await Notification.findOne({
    userId,
    type: "alert",
    title: { $regex: category.name },
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });
  if (recentDupe) return;

  await Notification.create({
    userId,
    type: "alert",
    title: "Budget Alert",
    message:
      pct >= 100
        ? `You've gone over budget on ${category.name} — spent ${formatCurrency(total)} of ${formatCurrency(category.budget)}`
        : `You've used ${Math.round(pct)}% of your ${category.name} budget this month`,
  });
}

export async function createTransaction(prevState, formData) {
  const userId = await requireUserId();
  const data = readForm(formData);

  if (!data.title) return { error: "Please enter a title for this transaction." };
  if (!data.amount || data.amount <= 0) return { error: "Please enter a valid amount." };

  await dbConnect();
  const categoryId = data.type === "income" ? null : data.categoryId || null;
  await Transaction.create({
    userId,
    title: data.title,
    type: data.type,
    amount: data.amount,
    categoryId,
    accountId: data.accountId || null,
    method: data.method,
    date: new Date(data.date),
    description: data.description,
    tags: data.tags,
  });
  await maybeNotifyBudget(userId, categoryId);

  revalidateAll();
  revalidatePath("/notifications");
  redirect("/transactions");
}

export async function updateTransaction(id, prevState, formData) {
  const userId = await requireUserId();
  const data = readForm(formData);

  if (!data.title) return { error: "Please enter a title for this transaction." };
  if (!data.amount || data.amount <= 0) return { error: "Please enter a valid amount." };

  await dbConnect();
  const result = await Transaction.findOneAndUpdate(
    { _id: id, userId },
    {
      title: data.title,
      type: data.type,
      amount: data.amount,
      categoryId: data.type === "income" ? null : data.categoryId || null,
      accountId: data.accountId || null,
      method: data.method,
      date: new Date(data.date),
      description: data.description,
      tags: data.tags,
    }
  );
  if (!result) return { error: "Transaction not found." };

  revalidateAll();
  redirect(`/transactions/${id}`);
}

export async function deleteTransaction(id) {
  const userId = await requireUserId();
  await dbConnect();
  await Transaction.deleteOne({ _id: id, userId });
  revalidateAll();
  redirect("/transactions");
}
