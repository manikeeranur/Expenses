import { Wrench, RotateCw } from "lucide-react";
import Screen from "@/components/Screen";

export default function MaintenancePage() {
  return (
    <Screen withNav={false} className="flex min-h-dvh flex-col items-center justify-center px-8 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-light">
        <Wrench size={40} className="text-primary" strokeWidth={1.5} />
      </div>
      <h1 className="mt-6 text-lg font-bold">We&apos;re Under Maintenance</h1>
      <p className="mt-1 text-sm text-muted">
        We are working hard to improve your experience. Please try again later.
      </p>

      <button
        type="button"
        className="mt-6 flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25"
      >
        <RotateCw size={16} />
        Refresh
      </button>
    </Screen>
  );
}
