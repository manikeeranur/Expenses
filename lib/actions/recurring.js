"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/mongoose";
import RecurringPayment from "@/models/RecurringPayment";
import { requireUserId } from "@/lib/session";

export async function createRecurring(prevState, formData) {
  const userId = await requireUserId();
  const name = formData.get("name")?.toString().trim();
  const categoryId = formData.get("categoryId")?.toString() || null;
  const amount = Number(formData.get("amount"));
  const frequency = formData.get("frequency")?.toString() || "Monthly";
  const nextDate = formData.get("nextDate")?.toString();

  if (!name) return { error: "Please enter a payment name." };
  if (!amount || amount <= 0) return { error: "Please enter a valid amount." };
  if (!nextDate) return { error: "Please choose the next payment date." };

  await dbConnect();
  await RecurringPayment.create({ userId, name, categoryId, amount, frequency, nextDate: new Date(nextDate) });

  revalidatePath("/recurring");
  return { success: true };
}

export async function deleteRecurring(id) {
  const userId = await requireUserId();
  await dbConnect();
  await RecurringPayment.deleteOne({ _id: id, userId });
  revalidatePath("/recurring");
}
