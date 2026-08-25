import dbConnect from "@/lib/mongoose";
import Category from "@/models/Category";
import Account from "@/models/Account";

const DEFAULT_CATEGORIES = [
  { name: "Housing", icon: "Home", color: "#6C5CE7", budget: 18200 },
  { name: "Food", icon: "Utensils", color: "#21C37E", budget: 15000 },
  { name: "Bus", icon: "Bus", color: "#3AA0FF", budget: 3000 },
  { name: "Train", icon: "TrainFront", color: "#14B8A6", budget: 5100 },
  { name: "Shopping", icon: "ShoppingBag", color: "#F5A623", budget: 6500 },
  { name: "Utilities", icon: "Bolt", color: "#F2555A", budget: 4200 },
  { name: "Entertainment", icon: "Clapperboard", color: "#A45CE7", budget: 2000 },
  { name: "Health", icon: "HeartPulse", color: "#FF7A9C", budget: 2500 },
  { name: "Education", icon: "GraduationCap", color: "#2FC0D6", budget: 1200 },
  { name: "Others", icon: "MoreHorizontal", color: "#9AA0B4", budget: 1000 },
  { name: "Transfers", icon: "ArrowLeftRight", color: "#7C6FE0", budget: 0 },
];

export const TRANSFERS_CATEGORY = { name: "Transfers", icon: "ArrowLeftRight", color: "#7C6FE0", budget: 0 };

const DEFAULT_ACCOUNTS = [{ name: "Cash Wallet", type: "Cash", color: "#21C37E", balance: 0 }];

export async function seedDefaultsForUser(userId) {
  await dbConnect();
  await Category.insertMany(DEFAULT_CATEGORIES.map((c) => ({ ...c, userId })));
  await Account.insertMany(DEFAULT_ACCOUNTS.map((a) => ({ ...a, userId })));
}
