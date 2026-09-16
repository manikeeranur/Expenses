import "server-only";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import { formatCurrency } from "@/lib/format";
import User from "@/models/User";
import Category from "@/models/Category";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import Goal from "@/models/Goal";
import Lending from "@/models/Lending";
import RecurringPayment from "@/models/RecurringPayment";
import Notification from "@/models/Notification";

const oid = (id) => new mongoose.Types.ObjectId(id);

function plain(doc) {
  return JSON.parse(JSON.stringify(doc));
}

export async function getUser(userId) {
  await dbConnect();
  const user = await User.findById(userId).lean();
  return user ? plain(user) : null;
}

export async function getCategories(userId) {
  await dbConnect();
  const categories = await Category.find({ userId }).sort({ budget: -1 }).lean();
  return plain(categories);
}

export async function getCategoryById(userId, id) {
  await dbConnect();
  if (!mongoose.isValidObjectId(id)) return null;
  const category = await Category.findOne({ _id: id, userId }).lean();
  return category ? plain(category) : null;
}

export async function getAccounts(userId) {
  await dbConnect();
  const accounts = await Account.find({ userId }).sort({ createdAt: 1 }).lean();
  return plain(accounts);
}

export async function getAccountById(userId, id) {
  await dbConnect();
  if (!mongoose.isValidObjectId(id)) return null;
  const account = await Account.findOne({ _id: id, userId }).lean();
  return account ? plain(account) : null;
}

export async function getTransactions(userId, { limit, categoryId, accountId } = {}) {
  await dbConnect();
  const query = Transaction.find({ userId, ...(categoryId ? { categoryId } : {}), ...(accountId ? { accountId } : {}) })
    .sort({ date: -1, createdAt: -1 })
    .populate("categoryId", "name icon color")
    .populate("accountId", "name");
  if (limit) query.limit(limit);
  const transactions = await query.lean();
  return plain(transactions);
}

export async function getTransactionById(userId, id) {
  await dbConnect();
  if (!mongoose.isValidObjectId(id)) return null;
  const transaction = await Transaction.findOne({ _id: id, userId })
    .populate("categoryId", "name icon color")
    .populate("accountId", "name")
    .lean();
  return transaction ? plain(transaction) : null;
}

export async function getGoals(userId) {
  await dbConnect();
  const goals = await Goal.find({ userId }).sort({ createdAt: 1 }).lean();
  return plain(goals);
}

export async function getGoalById(userId, id) {
  await dbConnect();
  if (!mongoose.isValidObjectId(id)) return null;
  const goal = await Goal.findOne({ _id: id, userId }).lean();
  return goal ? plain(goal) : null;
}

export async function getLendings(userId) {
  await dbConnect();
  const lendings = await Lending.find({ userId }).sort({ dateGiven: -1 }).lean();
  return plain(lendings);
}

export async function getLendingById(userId, id) {
  await dbConnect();
  if (!mongoose.isValidObjectId(id)) return null;
  const lending = await Lending.findOne({ _id: id, userId }).lean();
  return lending ? plain(lending) : null;
}

export async function getRecurringPayments(userId) {
  await dbConnect();
  const payments = await RecurringPayment.find({ userId })
    .sort({ nextDate: 1 })
    .populate("categoryId", "name icon color")
    .lean();
  return plain(payments);
}

export async function getUnreadNotificationCount(userId) {
  await dbConnect();
  return Notification.countDocuments({ userId, read: false });
}

export async function getNotifications(userId) {
  await dbConnect();
  const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).lean();
  return plain(notifications);
}

function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

export async function getMonthSpendByCategory(userId, date = new Date()) {
  await dbConnect();
  const { start, end } = monthRange(date);
  const rows = await Transaction.aggregate([
    { $match: { userId: oid(userId), type: "expense", date: { $gte: start, $lt: end } } },
    { $group: { _id: "$categoryId", spent: { $sum: "$amount" } } },
  ]);
  const map = {};
  for (const row of rows) {
    if (row._id) map[row._id.toString()] = row.spent;
  }
  return map;
}

export async function getDashboardSummary(userId, date = new Date()) {
  await dbConnect();
  const { start, end } = monthRange(date);
  const prevMonthDate = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const { start: prevStart, end: prevEnd } = monthRange(prevMonthDate);

  const [totals, prevTotals] = await Promise.all([
    Transaction.aggregate([
      { $match: { userId: oid(userId), date: { $gte: start, $lt: end } } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { userId: oid(userId), date: { $gte: prevStart, $lt: prevEnd } } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]),
  ]);

  const totalExpenses = totals.find((t) => t._id === "expense")?.total || 0;
  const totalIncome = totals.find((t) => t._id === "income")?.total || 0;
  const prevExpenses = prevTotals.find((t) => t._id === "expense")?.total || 0;
  const prevIncome = prevTotals.find((t) => t._id === "income")?.total || 0;

  const categories = await getCategories(userId);
  const spendMap = await getMonthSpendByCategory(userId, date);
  const totalBudget = categories.reduce((sum, c) => sum + (c.budget || 0), 0);

  const categoriesWithSpend = categories.map((c) => ({
    ...c,
    spent: spendMap[c._id] || 0,
    percent: totalExpenses > 0 ? Math.round(((spendMap[c._id] || 0) / totalExpenses) * 100) : 0,
  }));

  const savings = totalIncome - totalExpenses;
  const budgetStatusPct = totalBudget > 0 ? Math.min(999, Math.round((totalExpenses / totalBudget) * 100)) : 0;

  return {
    totalExpenses,
    totalIncome,
    savings,
    expensesChangePct: prevExpenses > 0 ? Math.round(((totalExpenses - prevExpenses) / prevExpenses) * 1000) / 10 : 0,
    incomeChangePct: prevIncome > 0 ? Math.round(((totalIncome - prevIncome) / prevIncome) * 1000) / 10 : 0,
    budgetStatusPct,
    budgetStatusLabel: budgetStatusPct >= 100 ? "Over Budget" : budgetStatusPct >= 90 ? "Near Limit" : "On Track",
    savingsRatePct: totalIncome > 0 ? Math.round((savings / totalIncome) * 1000) / 10 : 0,
    categoriesWithSpend,
    totalBudget,
  };
}

export async function getExpenseTrendForMonth(userId, date = new Date()) {
  await dbConnect();
  const { start, end } = monthRange(date);
  const rows = await Transaction.aggregate([
    { $match: { userId: oid(userId), type: "expense", date: { $gte: start, $lt: end } } },
    { $group: { _id: { $dayOfMonth: "$date" }, total: { $sum: "$amount" } } },
    { $sort: { _id: 1 } },
  ]);

  const byDay = new Map(rows.map((r) => [r._id, r.total]));
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const points = [];
  let running = 0;
  const step = Math.max(1, Math.round(daysInMonth / 6));
  for (let day = 1; day <= daysInMonth; day++) {
    running += byDay.get(day) || 0;
    if (day === 1 || day % step === 0 || day === daysInMonth) {
      points.push({ day: `${date.toLocaleDateString("en-IN", { month: "short" })} ${day}`, value: running });
    }
  }
  return points;
}

export async function getMonthlyTrend(userId, months = 6) {
  await dbConnect();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const rows = await Transaction.aggregate([
    { $match: { userId: oid(userId), type: "expense", date: { $gte: start } } },
    { $group: { _id: { y: { $year: "$date" }, m: { $month: "$date" } }, total: { $sum: "$amount" } } },
  ]);

  const map = new Map(rows.map((r) => [`${r._id.y}-${r._id.m}`, r.total]));
  const result = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    result.push({ month: d.toLocaleDateString("en-IN", { month: "short" }), value: map.get(key) || 0, isCurrent: i === 0 });
  }
  return result;
}

export async function getMonthlyIncomeExpense(userId, months = 6) {
  await dbConnect();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const rows = await Transaction.aggregate([
    { $match: { userId: oid(userId), date: { $gte: start } } },
    { $group: { _id: { y: { $year: "$date" }, m: { $month: "$date" }, type: "$type" }, total: { $sum: "$amount" } } },
  ]);

  const map = new Map();
  for (const r of rows) {
    const key = `${r._id.y}-${r._id.m}`;
    if (!map.has(key)) map.set(key, { income: 0, expense: 0 });
    map.get(key)[r._id.type] = r.total;
  }

  const result = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const entry = map.get(key) || { income: 0, expense: 0 };
    result.push({ month: d.toLocaleDateString("en-IN", { month: "short" }), income: entry.income, expense: entry.expense });
  }
  return result;
}

export async function getCategoryStats(userId, categoryId, date = new Date()) {
  await dbConnect();
  const { start, end } = monthRange(date);
  const prevDate = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const { start: prevStart, end: prevEnd } = monthRange(prevDate);

  const match = { userId: oid(userId), type: "expense", categoryId: oid(categoryId) };

  const [thisMonth, lastMonth, count, weekly] = await Promise.all([
    Transaction.aggregate([
      { $match: { ...match, date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { ...match, date: { $gte: prevStart, $lt: prevEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Transaction.countDocuments({ userId, categoryId, date: { $gte: start, $lt: end } }),
    Transaction.aggregate([
      { $match: { ...match, date: { $gte: start, $lt: end } } },
      { $group: { _id: { $ceil: { $divide: [{ $dayOfMonth: "$date" }, 7] } }, total: { $sum: "$amount" } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    spent: thisMonth[0]?.total || 0,
    lastMonthSpent: lastMonth[0]?.total || 0,
    transactionCount: count,
    weeklyTrend: weekly.map((w) => ({ label: `W${w._id}`, value: w.total })),
  };
}

export async function getInsights(userId) {
  const now = new Date();
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [summary, prevSpend] = await Promise.all([
    getDashboardSummary(userId, now),
    getMonthSpendByCategory(userId, prevDate),
  ]);

  const insights = [];

  const risers = summary.categoriesWithSpend
    .map((c) => {
      const prev = prevSpend[c._id] || 0;
      const changePct = prev > 0 ? ((c.spent - prev) / prev) * 100 : c.spent > 0 ? 100 : 0;
      return { ...c, changePct };
    })
    .filter((c) => c.spent > 0 && c.changePct >= 15)
    .sort((a, b) => b.changePct - a.changePct);

  for (const c of risers.slice(0, 2)) {
    insights.push({
      id: `rise-${c._id}`,
      icon: "TrendingUp",
      tone: c.changePct >= 30 ? "danger" : "warning",
      title: `${c.name} spending is up ${Math.round(c.changePct)}% compared to last month`,
    });
  }

  if (summary.totalBudget > 0) {
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const projected = (summary.totalExpenses / Math.max(1, dayOfMonth)) * daysInMonth;
    if (projected > summary.totalBudget) {
      insights.push({
        id: "projected-overspend",
        icon: "AlertTriangle",
        tone: "warning",
        title: `At your current pace, you may exceed your monthly budget by ${formatCurrency(projected - summary.totalBudget)}`,
      });
    }
  }

  if (summary.totalIncome > 0) {
    if (summary.savingsRatePct >= 20) {
      insights.push({
        id: "savings-good",
        icon: "PiggyBank",
        tone: "success",
        title: `You've saved ${summary.savingsRatePct}% of your income this month. Great job!`,
      });
    } else if (summary.savingsRatePct < 0) {
      insights.push({
        id: "savings-negative",
        icon: "Wallet",
        tone: "danger",
        title: `You're spending more than you earn this month — expenses exceed income by ${formatCurrency(-summary.savings)}`,
      });
    }
  }

  if (!insights.length) {
    insights.push({
      id: "no-data",
      icon: "Wallet",
      tone: "info",
      title: "Add a few transactions to start seeing personalized insights here.",
    });
  }

  return insights;
}

export async function getRecentUpiContacts(userId, limit = 8) {
  await dbConnect();
  const rows = await Transaction.aggregate([
    { $match: { userId: oid(userId), method: "UPI", upiId: { $ne: null } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$upiId",
        name: { $first: "$title" },
        lastUsed: { $first: "$date" },
      },
    },
    { $sort: { lastUsed: -1 } },
    { $limit: limit },
  ]);
  return rows.map((r) => ({
    upiId: r._id,
    name: r.name.replace(/^Sent to |^Received from /, ""),
  }));
}

export async function getUpiTransactions(userId, limit = 10) {
  await dbConnect();
  const transactions = await Transaction.find({ userId, tags: { $in: ["UPI", "Razorpay"] } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return plain(transactions);
}

export async function getCalendarEventsForMonth(userId, year, month) {
  await dbConnect();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  const transactions = await Transaction.find({ userId, date: { $gte: start, $lt: end } })
    .sort({ date: 1 })
    .populate("categoryId", "name icon color")
    .lean();
  const byDate = {};
  for (const t of transactions) {
    const key = new Date(t.date).toISOString().slice(0, 10);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push({
      _id: t._id.toString(),
      title: t.title,
      amount: t.amount,
      type: t.type,
      category: t.categoryId ? { name: t.categoryId.name, icon: t.categoryId.icon, color: t.categoryId.color } : null,
    });
  }
  return plain(byDate);
}
