import Link from "next/link";
import { Compass } from "lucide-react";
import Screen from "@/components/Screen";

export default function NotFound() {
  return (
    <Screen withNav={false} className="flex min-h-dvh flex-col items-center justify-center px-8 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-light">
        <Compass size={40} className="text-primary" strokeWidth={1.5} />
      </div>
      <h1 className="mt-6 text-lg font-bold">Oops! Page Not Found</h1>
      <p className="mt-1 text-sm text-muted">The page you are looking for does not exist.</p>

      <Link
        href="/dashboard"
        className="mt-6 flex items-center justify-center rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25"
      >
        Go to Dashboard
      </Link>
    </Screen>
  );
}
