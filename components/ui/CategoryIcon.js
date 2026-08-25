import { getIcon } from "@/lib/icons";

export default function CategoryIcon({ icon, color = "#6C5CE7", size = "md" }) {
  const Icon = getIcon(icon);
  const dims = {
    sm: "h-8 w-8",
    md: "h-11 w-11",
    lg: "h-14 w-14",
  }[size] || "h-11 w-11";
  const iconSize = {
    sm: 15,
    md: 20,
    lg: 26,
  }[size] || 20;

  return (
    <div
      className={`flex ${dims} shrink-0 items-center justify-center rounded-2xl`}
      style={{ backgroundColor: `${color}1f` }}
    >
      <Icon size={iconSize} color={color} strokeWidth={2.25} />
    </div>
  );
}
