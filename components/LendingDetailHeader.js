"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function LendingDetailHeader({ initial, title, subtitle, children }) {
  const router = useRouter();

  return (
    <header className="flex items-center gap-4 px-4 pb-4 pt-4">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Go back"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface shadow-sm shadow-black/5"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-light text-base font-bold text-primary">
        {initial}
      </div>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-bold">{title}</h1>
        <p className="truncate text-xs text-muted">{subtitle}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </header>
  );
}
