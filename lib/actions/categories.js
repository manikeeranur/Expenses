"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongoose";
import Category from "@/models/Category";
import { requireUserId } from "@/lib/session";

export async function createCategory(prevState, formData) {
  const userId = await requireUserId();
  const name = formData.get("name")?.toString().trim();
  const icon = formData.get("icon")?.toString() || "MoreHorizontal";
  const color = formData.get("color")?.toString() || "#6C5CE7";
  const budget = Number(formData.get("budget")) || 0;

  if (!name) return { error: "Please enter a category name." };

  await dbConnect();
  await Category.create({ userId, name, icon, color, budget });

  revalidatePath("/categories");
  revalidatePath("/budgets");
  return { success: true };
}

export async function updateCategoryBudget(id, formData) {
  const userId = await requireUserId();
  const budget = Number(formData.get("budget"));
  if (Number.isNaN(budget) || budget < 0) return;

  await dbConnect();
  await Category.updateOne({ _id: id, userId }, { budget });

  revalidatePath("/categories");
  revalidatePath(`/categories/${id}`);
  revalidatePath("/budgets");
}

export async function updateCategory(id, prevState, formData) {
  const userId = await requireUserId();
  const name = formData.get("name")?.toString().trim();
  const icon = formData.get("icon")?.toString() || "MoreHorizontal";
  const color = formData.get("color")?.toString() || "#6C5CE7";
  const budget = Number(formData.get("budget")) || 0;

  if (!name) return { error: "Please enter a category name." };

  await dbConnect();
  const result = await Category.updateOne({ _id: id, userId }, { name, icon, color, budget });
  if (!result.matchedCount) return { error: "Category not found." };

  revalidatePath("/categories");
  revalidatePath(`/categories/${id}`);
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteCategory(id) {
  const userId = await requireUserId();
  await dbConnect();
  await Category.deleteOne({ _id: id, userId });

  revalidatePath("/categories");
  revalidatePath("/budgets");
  redirect("/categories");
}

export async function reorderCategories(orderedIds) {
  const userId = await requireUserId();
  await dbConnect();
  await Promise.all(orderedIds.map((id, index) => Category.updateOne({ _id: id, userId }, { order: index })));
  revalidatePath("/categories");
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
}
