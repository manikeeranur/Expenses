"use client";

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Dot } from "recharts";

function ActiveDot(props) {
  const { cx, cy, payload } = props;
  if (!payload.highlight) return null;
  return <Dot cx={cx} cy={cy} r={5} fill="#6C5CE7" stroke="#fff" strokeWidth={2} />;
}

export default function TrendLineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#ecebf5" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#8b8aa3" }} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: "#8b8aa3" }}
          tickFormatter={(v) => `${Math.round(v / 1000)}k`}
        />
        <Tooltip
          formatter={(value) => [`₹${value.toLocaleString("en-IN")}`, "Expenses"]}
          contentStyle={{ borderRadius: 12, border: "1px solid #ecebf5", fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#6C5CE7"
          strokeWidth={2.5}
          dot={<ActiveDot />}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
