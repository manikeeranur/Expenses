"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, ResponsiveContainer } from "recharts";

export default function InterestPaymentsChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart data={data} margin={{ top: 24, right: 8, left: -14, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#ecebf5" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#8b8aa3" }} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: "#8b8aa3" }}
          tickFormatter={(v) => v.toLocaleString("en-IN")}
        />
        <Bar dataKey="value" fill="#6C5CE7" radius={[6, 6, 0, 0]} maxBarSize={40} isAnimationActive={false}>
          <LabelList
            dataKey="value"
            position="top"
            offset={8}
            formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`}
            style={{ fontSize: 11, fontWeight: 600, fill: "var(--color-foreground)" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
