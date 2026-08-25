import { LogOut } from "lucide-react";
import { logout } from "@/lib/actions/auth";

export default function LogoutButton() {
  return (
    <form action={logout} className="mt-4">
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-danger/30 bg-danger-light py-3.5 text-sm font-semibold text-danger"
      >
        <LogOut size={16} />
        Logout
      </button>
    </form>
  );
}
