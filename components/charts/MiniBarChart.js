"use client";

import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from "recharts";

export default function MiniBarChart({ data, color = "#6C5CE7" }) {
  return (
    <ResponsiveContainer width="100%" height={90}>
      <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: "#8b8aa3" }} />
        <Bar dataKey="value" radius={[6, 6, 6, 6]} maxBarSize={18}>
          {data.map((d, i) => (
            <Cell key={i} fill={color} fillOpacity={d.highlight ? 1 : 0.35} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
