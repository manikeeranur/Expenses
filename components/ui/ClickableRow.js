"use client";

import { useRouter } from "next/navigation";

export default function ClickableRow({ href, children, className = "" }) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(href)}
      className={`cursor-pointer transition-colors hover:bg-background ${className}`}
    >
      {children}
    </tr>
  );
}
