"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { requireUserId } from "@/lib/session";

export async function updatePreference(key, value) {
  const userId = await requireUserId();
  await dbConnect();
  await User.updateOne({ _id: userId }, { [`preferences.${key}`]: value });
  revalidatePath("/settings");
  revalidatePath("/profile");
}

export async function updatePersonalInfo(prevState, formData) {
  const userId = await requireUserId();
  const name = formData.get("name")?.toString().trim();
  if (!name) return { error: "Please enter your name." };

  await dbConnect();
  await User.updateOne({ _id: userId }, { name });

  revalidatePath("/profile");
  revalidatePath("/settings");
  return { success: true };
}
