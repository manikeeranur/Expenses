"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from "recharts";
import { formatCurrencyPrecise } from "@/lib/format";

const PRINCIPAL_COLOR = "#f2555a";
const PRINCIPAL_PAID_COLOR = "#21c37e";
const OUTSTANDING_COLOR = "#f5a623";
const INTEREST_COLOR = "#3aa0ff";

const SERIES = [
  { key: "principal", name: "Principal", color: PRINCIPAL_COLOR },
  { key: "principalRepaid", name: "Principal Paid", color: PRINCIPAL_PAID_COLOR },
  { key: "outstanding", name: "Outstanding", color: OUTSTANDING_COLOR },
  { key: "interest", name: "Interest Collected", color: INTEREST_COLOR },
];

const NICE_STEPS = [1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000, 100000, 200000, 250000, 500000, 1000000, 2000000, 2500000, 5000000, 10000000];

function niceTicks(maxValue) {
  if (!maxValue || maxValue <= 0) return [0, 1000];
  const step = NICE_STEPS.find((s) => maxValue / s <= 6) || NICE_STEPS[NICE_STEPS.length - 1];
  const count = Math.ceil(maxValue / step);
  return Array.from({ length: count + 1 }, (_, i) => i * step);
}

function formatIndianTick(v) {
  if (v >= 100000) {
    const lakhs = v / 100000;
    return `${Number.isInteger(lakhs) ? lakhs : lakhs.toFixed(1)}L`;
  }
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return `${v}`;
}

function ValueLabel({ x, y, width, height, value, fill }) {
  if (!value) return null;
  const text = `₹${formatIndianTick(value)}`;
  const boxWidth = text.length * 5.5 + 10;
  const cy = y + height / 2;
  const lx = x + width + 4;

  return (
    <g>
      <rect x={lx} y={cy - 7} width={boxWidth} height={13} rx={6.5} fill={fill} />
      <text x={lx + boxWidth / 2} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight={600} fill="#fff">
        {text}
      </text>
    </g>
  );
}

export default function LendingBarChart({ data }) {
  const maxValue = Math.max(0, ...data.flatMap((d) => SERIES.map((s) => d[s.key] || 0)));
  const ticks = niceTicks(maxValue);
  const height = Math.max(220, data.length * 100);

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 0 }} barGap={4} barCategoryGap="20%">
          <CartesianGrid horizontal={false} stroke="#ecebf5" />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#8b8aa3" }}
            ticks={ticks}
            domain={[0, ticks[ticks.length - 1]]}
            tickFormatter={formatIndianTick}
          />
          <YAxis
            type="category"
            dataKey="borrower"
            tickLine={false}
            axisLine={false}
            width={90}
            tick={{ fontSize: 11, fill: "#4b4a63" }}
          />
          <Tooltip
            formatter={(value, name) => [formatCurrencyPrecise(value), name]}
            contentStyle={{ borderRadius: 12, border: "1px solid #ecebf5", fontSize: 12 }}
          />
          {SERIES.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[0, 4, 4, 0]} maxBarSize={16}>
              <LabelList dataKey={s.key} content={(props) => <ValueLabel {...props} fill={s.color} />} />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-muted">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
