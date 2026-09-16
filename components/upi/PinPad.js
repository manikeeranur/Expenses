"use client";

import { Delete } from "lucide-react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

export default function PinPad({ value, onChange, length = 4 }) {
  function press(key) {
    if (key === "back") {
      onChange(value.slice(0, -1));
    } else if (key && value.length < length) {
      onChange(value + key);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-center gap-4">
        {Array.from({ length }).map((_, i) => (
          <span
            key={i}
            className={`h-3.5 w-3.5 rounded-full border-2 border-primary ${i < value.length ? "bg-primary" : "bg-transparent"}`}
          />
        ))}
      </div>

      <div className="mx-auto mt-8 grid max-w-[280px] grid-cols-3 gap-3">
        {KEYS.map((key, i) =>
          key === "" ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => press(key)}
              aria-label={key === "back" ? "Delete" : key}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-surface text-xl font-semibold shadow-sm shadow-black/[0.03] active:bg-primary-light"
            >
              {key === "back" ? <Delete size={20} className="text-muted" /> : key}
            </button>
          )
        )}
      </div>
    </div>
  );
}
