import { redirect } from "next/navigation";

export default function SetuCallbackPage() {
  redirect("/accounts/link/complete");
}
