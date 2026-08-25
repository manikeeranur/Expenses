"use client";

import { useActionState, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { getIcon, CATEGORY_ICON_CHOICES, CATEGORY_COLOR_CHOICES } from "@/lib/icons";
import Modal from "@/components/ui/Modal";

export default function CategoryForm({ mode = "create", action, defaults }) {
  const [open, setOpen] = useState(false);
  const [icon, setIcon] = useState(defaults?.icon || CATEGORY_ICON_CHOICES[0]);
  const [color, setColor] = useState(defaults?.color || CATEGORY_COLOR_CHOICES[0]);
  const [state, formAction, pending] = useActionState(async (prevState, formData) => {
    const result = await action(prevState, formData);
    if (result?.success) setOpen(false);
    return result;
  }, undefined);

  return (
    <>
      {mode === "create" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Add category"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/25"
        >
          <Plus size={18} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-primary"
        >
          <Pencil size={12} />
          Edit
        </button>
      )}

      {open ? (
        <Modal title={mode === "create" ? "Add Category" : "Edit Category"} onClose={() => setOpen(false)}>
          <form action={formAction} className="space-y-4">
            <input
              name="name"
              type="text"
              defaultValue={defaults?.name || ""}
              placeholder="Category name"
              required
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
            />

            <input
              name="budget"
              type="number"
              min="0"
              step="0.01"
              defaultValue={defaults?.budget ?? ""}
              placeholder="Monthly budget"
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
            />

            <div>
              <p className="mb-2 text-xs font-medium text-muted">Color</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLOR_CHOICES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="h-8 w-8 rounded-full border-2"
                    style={{ backgroundColor: c, borderColor: color === c ? "var(--color-foreground)" : "transparent" }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted">Icon</p>
              <div className="grid grid-cols-8 gap-2">
                {CATEGORY_ICON_CHOICES.map((name) => {
                  const Icon = getIcon(name);
                  const active = icon === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setIcon(name)}
                      aria-label={name}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border-2"
                      style={{
                        backgroundColor: active ? `${color}1f` : "var(--color-surface)",
                        borderColor: active ? color : "var(--color-border)",
                      }}
                    >
                      <Icon size={16} color={active ? color : "var(--color-muted)"} />
                    </button>
                  );
                })}
              </div>
            </div>

            <input type="hidden" name="icon" value={icon} />
            <input type="hidden" name="color" value={color} />

            {state?.error ? <p className="text-xs font-medium text-danger">{state.error}</p> : null}

            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-60"
            >
              {pending ? "Saving..." : "Save"}
            </button>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
