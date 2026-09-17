"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import TransactionForm from "@/components/TransactionForm";
import { createTransaction, getTransactionFormOptions } from "@/lib/actions/transactions";

export default function AddTransactionModal({ children }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState(null);

  function handleOpen() {
    setOpen(true);
    if (!options) {
      getTransactionFormOptions().then(setOptions);
    }
  }

  return (
    <>
      {children(handleOpen)}

      {open ? (
        <Modal title="Add Transaction" onClose={() => setOpen(false)}>
          {options ? (
            <TransactionForm
              action={createTransaction}
              categories={options.categories}
              accounts={options.accounts}
              onCancel={() => setOpen(false)}
              submitLabel="Save Transaction"
              hideHeader
            />
          ) : (
            <p className="py-10 text-center text-sm text-muted">Loading...</p>
          )}
        </Modal>
      ) : null}
    </>
  );
}
