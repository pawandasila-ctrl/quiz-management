import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sidebarConfig } from "./app/(dashboard)/_data/sidebar.data";
import type { UserRole } from "./models/auth/types";

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.get("has_session")?.value === "true";
  const role = request.cookies.get("role")?.value;
  const path = request.nextUrl.pathname;

  // Find if the path is managed under our restricted sidebar items
  const matchingItem = sidebarConfig.find(
    (item) => path === item.url || path.startsWith(item.url + "/")
  );

  // 1. Unauthenticated user accessing a protected route
  if (!hasSession && matchingItem) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Authenticated user accessing auth routes — redirect to their home
  if (hasSession && (path === "/login" || path === "/register")) {
    const defaultUrl = role === "admin" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(defaultUrl, request.url));
  }

  // 3. Authenticated user accessing a route they don't have permission for
  if (hasSession && matchingItem && !matchingItem.roles.includes(role as UserRole)) {
    const defaultUrl = role === "admin" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(defaultUrl, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/login",
    "/register",
  ],
};
