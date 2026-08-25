import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";

export async function getCurrentUserId() {
  const session = await auth();
  return session?.user?.id || null;
}

export async function requireUserId() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  await dbConnect();
  const exists = await User.exists({ _id: userId });
  if (!exists) {
    // Session references a user that no longer exists in the database
    // (e.g. deleted account). Server Components can't clear cookies
    // mid-render, so hand off to a Route Handler that can actually end
    // the session, instead of letting every page that assumes a valid
    // user crash on a null lookup.
    redirect("/api/auth/force-logout");
  }

  return userId;
}
