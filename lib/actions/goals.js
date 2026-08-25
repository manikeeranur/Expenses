"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongoose";
import Goal from "@/models/Goal";
import { requireUserId } from "@/lib/session";

export async function createGoal(prevState, formData) {
  const userId = await requireUserId();
  const name = formData.get("name")?.toString().trim();
  const target = Number(formData.get("target"));
  const dueDate = formData.get("dueDate")?.toString();
  const icon = formData.get("icon")?.toString() || "Target";
  const color = formData.get("color")?.toString() || "#6C5CE7";

  if (!name) return { error: "Please enter a goal name." };
  if (!target || target <= 0) return { error: "Please enter a valid target amount." };
  if (!dueDate) return { error: "Please choose a target date." };

  await dbConnect();
  await Goal.create({ userId, name, target, dueDate: new Date(dueDate), icon, color, saved: 0, contributions: [] });

  revalidatePath("/goals");
  redirect("/goals");
}

export async function addContribution(id, prevState, formData) {
  const userId = await requireUserId();
  const amount = Number(formData.get("amount"));
  if (!amount || amount <= 0) return { error: "Please enter a valid amount." };

  await dbConnect();
  const goal = await Goal.findOne({ _id: id, userId });
  if (!goal) return { error: "Goal not found." };

  goal.saved += amount;
  goal.contributions.unshift({ amount, date: new Date() });
  await goal.save();

  revalidatePath("/goals");
  revalidatePath(`/goals/${id}`);
  return { success: true };
}

export async function deleteGoal(id) {
  const userId = await requireUserId();
  await dbConnect();
  await Goal.deleteOne({ _id: id, userId });
  revalidatePath("/goals");
  redirect("/goals");
}
