import { signOut } from "@/auth";

// Server Components can't clear cookies mid-render, so requireUserId()
// redirects here (a Route Handler, where signOut() is allowed to run) to
// end a session that points at a user no longer in the database.
export async function GET() {
  await signOut({ redirectTo: "/login" });
}
