"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCurrencyPrecise } from "@/lib/format";

const INTEREST_COLOR = "#6C5CE7";
const OUTSTANDING_COLOR = "#3AA0FF";

export default function LendingBarChart({ data }) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }} barGap={4}>
          <CartesianGrid vertical={false} stroke="#ecebf5" />
          <XAxis dataKey="borrower" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#8b8aa3" }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#8b8aa3" }}
            tickFormatter={(v) => `${Math.round(v / 1000)}k`}
          />
          <Tooltip
            formatter={(value, name) => [formatCurrencyPrecise(value), name]}
            contentStyle={{ borderRadius: 12, border: "1px solid #ecebf5", fontSize: 12 }}
          />
          <Bar dataKey="outstanding" name="Outstanding Principal" fill={OUTSTANDING_COLOR} radius={[4, 4, 4, 4]} maxBarSize={16} />
          <Bar dataKey="interest" name="Interest Collected" fill={INTEREST_COLOR} radius={[4, 4, 4, 4]} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex items-center justify-center gap-5 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: OUTSTANDING_COLOR }} />
          Outstanding Principal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: INTEREST_COLOR }} />
          Interest Collected
        </span>
      </div>
    </div>
  );
}
