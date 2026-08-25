const TONE_CLASSES = {
  success: "text-success",
  danger: "text-danger",
  info: "text-info",
};

export default function StatCard({ icon, label, value, changePct, changeLabel, tone = "info" }) {
  const up = changePct >= 0;
  const toneClass = TONE_CLASSES[tone] || TONE_CLASSES.info;
  return (
    <div className="flex-1 rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light">
        {icon}
      </div>
      <p className="mt-3 text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-bold">{value}</p>
      {changePct !== undefined ? (
        <p className={`mt-1 text-[11px] font-medium ${toneClass}`}>
          {up ? "↑" : "↓"} {Math.abs(changePct)}% {changeLabel}
        </p>
      ) : null}
    </div>
  );
}
