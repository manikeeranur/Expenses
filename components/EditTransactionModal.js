"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import Modal from "@/components/ui/Modal";
import TransactionForm from "@/components/TransactionForm";
import { updateTransaction, getTransactionFormOptions } from "@/lib/actions/transactions";

export default function EditTransactionModal({ transaction }) {
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
      <button
        type="button"
        onClick={handleOpen}
        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-background"
      >
        <Pencil size={15} className="text-muted" />
        Edit Transaction
      </button>

      {open ? (
        <Modal title="Edit Transaction" onClose={() => setOpen(false)}>
          {options ? (
            <TransactionForm
              action={updateTransaction.bind(null, transaction._id)}
              categories={options.categories}
              accounts={options.accounts}
              onCancel={() => setOpen(false)}
              onSuccess={() => setOpen(false)}
              submitLabel="Save Changes"
              hideHeader
              defaults={{
                type: transaction.type,
                amount: transaction.amount,
                title: transaction.title,
                categoryId: transaction.categoryId?._id,
                accountId: transaction.accountId?._id,
                method: transaction.method,
                date: new Date(transaction.date).toISOString().slice(0, 10),
                description: transaction.description,
                tags: transaction.tags,
              }}
            />
          ) : (
            <p className="py-10 text-center text-sm text-muted">Loading...</p>
          )}
        </Modal>
      ) : null}
    </>
  );
}
