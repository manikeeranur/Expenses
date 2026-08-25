"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, User, Settings, LogOut } from "lucide-react";
import { logout } from "@/lib/actions/auth";

export default function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const name = user?.name || "Account";
  const firstName = name.split(" ")[0];

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-3"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="text-sm font-medium">Hi, {firstName}</span>
        <ChevronDown size={14} className="text-muted" />
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-2xl border border-border bg-surface py-1.5 shadow-xl shadow-black/10">
          <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-background">
            <User size={15} className="text-muted" />
            Profile
          </Link>
          <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-background">
            <Settings size={15} className="text-muted" />
            Settings
          </Link>
          <form action={logout}>
            <button type="submit" className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-danger-light">
              <LogOut size={15} />
              Logout
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
