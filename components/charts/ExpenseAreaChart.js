"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

export default function ExpenseAreaChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6C5CE7" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#6C5CE7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: "#8b8aa3" }}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: "#8b8aa3" }}
          tickFormatter={(v) => (v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`)}
          width={44}
        />
        <Tooltip
          formatter={(value) => [`₹${value.toLocaleString("en-IN")}`, "Expenses"]}
          contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", fontSize: 12, background: "var(--color-surface)" }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#6C5CE7"
          strokeWidth={2.5}
          fill="url(#expenseFill)"
          dot={{ r: 3, fill: "#6C5CE7", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
