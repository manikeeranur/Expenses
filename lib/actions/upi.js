"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/mongoose";
import Transaction from "@/models/Transaction";
import Category from "@/models/Category";
import { requireUserId } from "@/lib/session";
import { TRANSFERS_CATEGORY } from "@/lib/seed";

function generateUtr() {
  const digits = "0123456789";
  let ref = "";
  for (let i = 0; i < 12; i++) ref += digits[Math.floor(Math.random() * digits.length)];
  return ref;
}

async function getOrCreateTransfersCategory(userId) {
  let category = await Category.findOne({ userId, name: TRANSFERS_CATEGORY.name });
  if (!category) category = await Category.create({ ...TRANSFERS_CATEGORY, userId });
  return category;
}

function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/categories");
  revalidatePath("/budgets");
  revalidatePath("/reports");
  revalidatePath("/pay");
}

export async function sendMoney(prevState, formData) {
  const userId = await requireUserId();
  const payeeName = formData.get("payeeName")?.toString().trim();
  const upiId = formData.get("upiId")?.toString().trim();
  const amount = Number(formData.get("amount"));
  const note = formData.get("note")?.toString().trim() || "";
  const pin = formData.get("pin")?.toString() || "";

  if (!payeeName) return { error: "Enter who you're paying." };
  if (!upiId || !upiId.includes("@")) return { error: "Enter a valid UPI ID (e.g. name@bank)." };
  if (!amount || amount <= 0) return { error: "Enter a valid amount." };
  if (pin.length !== 4 && pin.length !== 6) return { error: "Enter your UPI PIN." };

  await dbConnect();
  const category = await getOrCreateTransfersCategory(userId);
  const reference = generateUtr();

  const transaction = await Transaction.create({
    userId,
    title: `Sent to ${payeeName}`,
    type: "expense",
    amount,
    categoryId: category._id,
    method: "UPI",
    date: new Date(),
    description: note,
    tags: ["UPI"],
    upiId,
    reference,
  });

  revalidateAll();
  return { success: true, reference, transactionId: transaction._id.toString(), amount, payeeName };
}

export async function receiveMoney(prevState, formData) {
  const userId = await requireUserId();
  const payerName = formData.get("payerName")?.toString().trim();
  const upiId = formData.get("upiId")?.toString().trim();
  const amount = Number(formData.get("amount"));
  const note = formData.get("note")?.toString().trim() || "";

  if (!payerName) return { error: "Enter who paid you." };
  if (!amount || amount <= 0) return { error: "Enter a valid amount." };

  await dbConnect();
  const reference = generateUtr();

  const transaction = await Transaction.create({
    userId,
    title: `Received from ${payerName}`,
    type: "income",
    amount,
    categoryId: null,
    method: "UPI",
    date: new Date(),
    description: note,
    tags: ["UPI"],
    upiId: upiId || null,
    reference,
  });

  revalidateAll();
  return { success: true, reference, transactionId: transaction._id.toString(), amount, payerName };
}
