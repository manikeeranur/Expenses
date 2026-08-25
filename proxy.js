import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_ROUTES = new Set(["/", "/login", "/signup", "/maintenance"]);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_ROUTES.has(pathname);
  const isLoggedIn = !!req.auth?.user;

  if (!isPublic && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if ((pathname === "/login" || pathname === "/signup" || pathname === "/") && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
