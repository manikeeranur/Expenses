"use client";

import AddTransactionModal from "@/components/AddTransactionModal";

export default function AddTransactionButton({ className = "", ariaLabel, children }) {
  return (
    <AddTransactionModal>
      {(open) => (
        <button type="button" onClick={open} aria-label={ariaLabel} className={className}>
          {children}
        </button>
      )}
    </AddTransactionModal>
  );
}
