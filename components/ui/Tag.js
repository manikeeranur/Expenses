export default function Tag({ children, tone = "primary" }) {
  const tones = {
    primary: "bg-primary-light text-primary-dark",
    success: "bg-success-light text-success",
    danger: "bg-danger-light text-danger",
    warning: "bg-warning-light text-warning",
    info: "bg-info-light text-info",
    neutral: "bg-border text-muted",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone] || tones.primary}`}>
      {children}
    </span>
  );
}
