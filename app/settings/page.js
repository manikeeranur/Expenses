import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Screen from "@/components/Screen";
import ScreenHeader from "@/components/ScreenHeader";
import PreferenceSwitch from "@/components/PreferenceSwitch";
import PreferenceSelect from "@/components/PreferenceSelect";
import PersonalInfoForm from "@/components/PersonalInfoForm";
import ThemeToggle from "@/components/ThemeToggle";
import LogoutButton from "@/components/LogoutButton";
import { requireUserId } from "@/lib/session";
import { getUser } from "@/lib/data";

const CURRENCIES = [{ value: "INR", label: "INR (₹)" }, { value: "USD", label: "USD ($)" }, { value: "EUR", label: "EUR (€)" }];
const DATE_FORMATS = [
  { value: "DD MMM YYYY", label: "DD MMM YYYY" },
  { value: "MMM DD, YYYY", label: "MMM DD, YYYY" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
];
const FIRST_DAYS = Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));

export default async function SettingsPage() {
  const userId = await requireUserId();
  const user = await getUser(userId);
  const prefs = user.preferences || {};

  return (
    <Screen withNav={false}>
      <ScreenHeader title="Settings" />

      <div className="space-y-5 px-5 pt-2">
        <div>
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">Personal Information</p>
          <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/[0.03]">
            <PersonalInfoForm name={user.name} email={user.email} />
          </div>
        </div>

        <div>
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">Preferences</p>
          <div className="divide-y divide-border rounded-2xl bg-surface shadow-sm shadow-black/[0.03]">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="flex-1 text-sm">Currency</span>
              <PreferenceSelect prefKey="currency" defaultValue={prefs.currency || "INR"} options={CURRENCIES} />
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="flex-1 text-sm">First Day of Month</span>
              <PreferenceSelect prefKey="firstDayOfMonth" defaultValue={String(prefs.firstDayOfMonth || 1)} options={FIRST_DAYS} />
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="flex-1 text-sm">Date Format</span>
              <PreferenceSelect prefKey="dateFormat" defaultValue={prefs.dateFormat || "DD MMM YYYY"} options={DATE_FORMATS} />
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">Notifications</p>
          <div className="divide-y divide-border rounded-2xl bg-surface shadow-sm shadow-black/[0.03]">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="flex-1 text-sm">Push Notifications</span>
              <PreferenceSwitch prefKey="pushNotifications" defaultChecked={prefs.pushNotifications !== false} />
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="flex-1 text-sm">Email Notifications</span>
              <PreferenceSwitch prefKey="emailNotifications" defaultChecked={prefs.emailNotifications !== false} />
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">Data</p>
          <div className="divide-y divide-border rounded-2xl bg-surface shadow-sm shadow-black/[0.03]">
            <Link href="/export" className="flex items-center gap-3 px-4 py-3.5">
              <span className="flex-1 text-sm">Export Data</span>
              <ChevronRight size={16} className="text-muted" />
            </Link>
          </div>
        </div>

        <div>
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">Appearance</p>
          <div className="divide-y divide-border rounded-2xl bg-surface shadow-sm shadow-black/[0.03]">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="flex-1 text-sm">Dark Mode</span>
              <ThemeToggle compact />
            </div>
          </div>
        </div>

        <LogoutButton />
      </div>
    </Screen>
  );
}
