"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongoose";
import Lending from "@/models/Lending";
import { requireUserId } from "@/lib/session";
import { computeLendingStats, buildReminderMessage } from "@/lib/lending";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

function parseMobile(formData) {
  const digits = (formData.get("mobile")?.toString() || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : "";
}

export async function createLending(prevState, formData) {
  const userId = await requireUserId();
  const borrower = formData.get("borrower")?.toString().trim();
  const mobile = parseMobile(formData);
  const principal = Number(formData.get("principal"));
  const dateGiven = formData.get("dateGiven")?.toString();
  const interestRatePercent = Number(formData.get("interestRatePercent")) || 0;
  const interestDueDay = Number(formData.get("interestDueDay")) || undefined;
  const note = formData.get("note")?.toString().trim() || "";

  if (!borrower) return { error: "Please enter who the money was lent to." };
  if (!mobile) return { error: "Please enter a valid 10-digit mobile number." };
  if (!principal || principal <= 0) return { error: "Please enter a valid amount." };
  if (!dateGiven) return { error: "Please choose the date given." };

  await dbConnect();
  await Lending.create({
    userId,
    borrower,
    mobile,
    principal,
    dateGiven: new Date(dateGiven),
    interestRatePercent,
    interestDueDay,
    note,
    status: "active",
    payments: [],
  });

  revalidatePath("/lending");
  return { success: true };
}

export async function updateLending(id, prevState, formData) {
  const userId = await requireUserId();
  const borrower = formData.get("borrower")?.toString().trim();
  const mobile = parseMobile(formData);
  const principal = Number(formData.get("principal"));
  const dateGiven = formData.get("dateGiven")?.toString();
  const interestRatePercent = Number(formData.get("interestRatePercent")) || 0;
  const interestDueDay = Number(formData.get("interestDueDay")) || undefined;
  const note = formData.get("note")?.toString().trim() || "";

  if (!borrower) return { error: "Please enter who the money was lent to." };
  if (!mobile) return { error: "Please enter a valid 10-digit mobile number." };
  if (!principal || principal <= 0) return { error: "Please enter a valid amount." };
  if (!dateGiven) return { error: "Please choose the date given." };

  await dbConnect();
  const result = await Lending.updateOne(
    { _id: id, userId },
    { borrower, mobile, principal, dateGiven: new Date(dateGiven), interestRatePercent, interestDueDay, note }
  );
  if (!result.matchedCount) return { error: "Entry not found." };

  revalidatePath("/lending");
  revalidatePath(`/lending/${id}`);
  return { success: true };
}

export async function addPayment(id, prevState, formData) {
  const userId = await requireUserId();
  const amount = Number(formData.get("amount"));
  const date = formData.get("date")?.toString();
  const type = formData.get("type")?.toString() === "principal" ? "principal" : "interest";
  const method = formData.get("method")?.toString() === "upi" ? "upi" : "cash";
  const remarks = formData.get("remarks")?.toString().trim() || "";

  if (!amount || amount <= 0) return { error: "Please enter a valid amount." };
  if (!date) return { error: "Please choose a paid date." };

  await dbConnect();
  const lending = await Lending.findOne({ _id: id, userId });
  if (!lending) return { error: "Entry not found." };

  lending.payments.push({ amount, date: new Date(date), type, method, remarks });
  await lending.save({ validateModifiedOnly: true });

  revalidatePath("/lending");
  revalidatePath(`/lending/${id}`);
  return { success: true };
}

export async function updatePayment(id, index, prevState, formData) {
  const userId = await requireUserId();
  const amount = Number(formData.get("amount"));
  const date = formData.get("date")?.toString();
  const type = formData.get("type")?.toString() === "principal" ? "principal" : "interest";
  const method = formData.get("method")?.toString() === "upi" ? "upi" : "cash";
  const remarks = formData.get("remarks")?.toString().trim() || "";

  if (!amount || amount <= 0) return { error: "Please enter a valid amount." };
  if (!date) return { error: "Please choose a paid date." };

  await dbConnect();
  const lending = await Lending.findOne({ _id: id, userId });
  if (!lending) return { error: "Entry not found." };
  if (!lending.payments[index]) return { error: "Payment not found." };

  lending.payments[index].amount = amount;
  lending.payments[index].date = new Date(date);
  lending.payments[index].type = type;
  lending.payments[index].method = method;
  lending.payments[index].remarks = remarks;
  await lending.save({ validateModifiedOnly: true });

  revalidatePath("/lending");
  revalidatePath(`/lending/${id}`);
  return { success: true };
}

export async function deletePayment(id, index) {
  const userId = await requireUserId();
  await dbConnect();
  const lending = await Lending.findOne({ _id: id, userId });
  if (!lending) return;

  lending.payments.splice(index, 1);
  await lending.save({ validateModifiedOnly: true });

  revalidatePath("/lending");
  revalidatePath(`/lending/${id}`);
}

export async function sendReminder(id) {
  const userId = await requireUserId();
  await dbConnect();
  const lending = await Lending.findOne({ _id: id, userId });
  if (!lending) return { error: "Entry not found." };
  if (!lending.mobile) return { error: "No mobile number on file for this entry." };

  const stats = computeLendingStats(lending);
  const message = buildReminderMessage(lending, stats);

  let status;
  try {
    const result = await sendWhatsAppMessage(lending.mobile, message);
    status = result.status;
  } catch {
    status = "failed";
  }

  lending.reminders.unshift({ date: new Date(), message, status });
  await lending.save();

  revalidatePath(`/lending/${id}`);
  return { success: true, status, message };
}

export async function setLendingStatus(id, status) {
  const userId = await requireUserId();
  await dbConnect();
  await Lending.updateOne({ _id: id, userId }, { status });
  revalidatePath("/lending");
  revalidatePath(`/lending/${id}`);
}

export async function deleteLending(id) {
  const userId = await requireUserId();
  await dbConnect();
  await Lending.deleteOne({ _id: id, userId });
  revalidatePath("/lending");
  redirect("/lending");
}

export async function reorderLendings(orderedIds) {
  const userId = await requireUserId();
  await dbConnect();
  await Promise.all(
    orderedIds.map((id, index) => Lending.updateOne({ _id: id, userId }, { order: index }))
  );
  revalidatePath("/lending");
}
