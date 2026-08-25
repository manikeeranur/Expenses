"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function ScreenHeader({ title, subtitle, right, onBack }) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 bg-background/95 px-5 pb-3 pt-6 backdrop-blur">
      <button
        type="button"
        onClick={onBack || (() => router.back())}
        aria-label="Go back"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-surface shadow-sm shadow-black/5"
      >
        <ChevronLeft size={20} />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[17px] font-semibold">{title}</h1>
        {subtitle ? <p className="truncate text-xs text-muted">{subtitle}</p> : null}
      </div>
      {right}
    </header>
  );
}
