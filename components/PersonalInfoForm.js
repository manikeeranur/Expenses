"use client";

import { useActionState } from "react";
import { updatePersonalInfo } from "@/lib/actions/settings";

export default function PersonalInfoForm({ name, email }) {
  const [state, action, pending] = useActionState(updatePersonalInfo, undefined);

  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="text-xs text-muted">Full Name</label>
        <input
          name="name"
          type="text"
          defaultValue={name}
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="text-xs text-muted">Email</label>
        <p className="mt-1 rounded-xl bg-background px-3 py-2 text-sm text-muted">{email}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save"}
        </button>
        {state?.success ? <span className="text-xs font-medium text-success">Saved</span> : null}
        {state?.error ? <span className="text-xs font-medium text-danger">{state.error}</span> : null}
      </div>
    </form>
  );
}
