"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { seedDefaultsForUser } from "@/lib/seed";

export async function signup(prevState, formData) {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString() || "";
  const confirmPassword = formData.get("confirmPassword")?.toString() || "";

  if (!name || name.length < 2) return { error: "Please enter your full name." };
  if (!email || !email.includes("@")) return { error: "Please enter a valid email address." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirmPassword) return { error: "Passwords do not match." };

  await dbConnect();
  const existing = await User.findOne({ email });
  if (existing) return { error: "An account with this email already exists." };

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash });
  await seedDefaultsForUser(user._id);

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Account created, but sign-in failed. Please log in." };
    throw error;
  }
}

export async function login(prevState, formData) {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString() || "";

  if (!email || !password) return { error: "Please enter your email and password." };

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Invalid email or password." };
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/dashboard" });
}
