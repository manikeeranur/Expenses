"use client";

import { IconBrandGoogleFilled, IconBrandApple } from "@tabler/icons-react";
import { signInWithGoogle } from "@/lib/actions/auth";

export default function SocialButtons({ googleEnabled }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {googleEnabled ? (
        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-3 text-sm font-medium"
          >
            <IconBrandGoogleFilled size={18} />
            Google
          </button>
        </form>
      ) : (
        <button
          type="button"
          disabled
          className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-3 text-sm font-medium opacity-40"
        >
          <IconBrandGoogleFilled size={18} />
          Google
        </button>
      )}
      <button
        type="button"
        disabled
        title="Apple sign-in isn't set up yet"
        className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-3 text-sm font-medium opacity-40"
      >
        <IconBrandApple size={20} />
        Apple
      </button>
    </div>
  );
}
