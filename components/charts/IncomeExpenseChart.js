"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/format";

const INCOME_COLOR = "#21C37E";
const EXPENSE_COLOR = "#F2555A";

export default function IncomeExpenseChart({ data }) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }} barGap={4}>
          <CartesianGrid vertical={false} stroke="#ecebf5" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#8b8aa3" }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#8b8aa3" }}
            tickFormatter={(v) => `${Math.round(v / 1000)}k`}
          />
          <Tooltip
            formatter={(value, name) => [formatCurrency(value), name]}
            contentStyle={{ borderRadius: 12, border: "1px solid #ecebf5", fontSize: 12 }}
          />
          <Bar dataKey="income" name="Income" fill={INCOME_COLOR} radius={[4, 4, 4, 4]} maxBarSize={16} />
          <Bar dataKey="expense" name="Expense" fill={EXPENSE_COLOR} radius={[4, 4, 4, 4]} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex items-center justify-center gap-5 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: INCOME_COLOR }} />
          Income
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: EXPENSE_COLOR }} />
          Expense
        </span>
      </div>
    </div>
  );
}
