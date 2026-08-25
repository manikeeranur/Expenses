"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/mongoose";
import Notification from "@/models/Notification";
import { requireUserId } from "@/lib/session";

export async function markNotificationRead(id) {
  const userId = await requireUserId();
  await dbConnect();
  await Notification.updateOne({ _id: id, userId }, { read: true });
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const userId = await requireUserId();
  await dbConnect();
  await Notification.updateMany({ userId, read: false }, { read: true });
  revalidatePath("/notifications");
}
