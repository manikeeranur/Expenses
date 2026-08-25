export default function ProgressBar({ value, max = 100, color = "#6C5CE7", trackClassName = "", height = "h-2" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`w-full ${height} rounded-full bg-border ${trackClassName}`}>
      <div
        className={`${height} rounded-full transition-all`}
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}
