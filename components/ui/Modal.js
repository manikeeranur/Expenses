"use client";

import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function Modal({ title, onClose, children, wide = false }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className={`max-h-[85vh] w-full overflow-y-auto rounded-3xl bg-surface p-5 shadow-2xl ${
          wide ? "max-w-md md:max-w-2xl lg:max-w-[70%]" : "max-w-md"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 -m-5 mb-4 flex items-center justify-between bg-surface p-5 pb-4">
          <h2 className="text-base font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full bg-background">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
