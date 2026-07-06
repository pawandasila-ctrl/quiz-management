import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sidebarConfig } from "./app/(dashboard)/_data/sidebar.data";
import type { UserRole } from "./modules/auth/types";
import {
  SECURITY_CONFIG,
  containsXssPattern,
  isSensitiveRoute,
} from "./security-rules";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const userAgent = request.headers.get("user-agent") || "unknown";
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  if (containsXssPattern(request.url) || containsXssPattern(path)) {
    return new NextResponse("Access Denied: Potential XSS Threat Detected.", {
      status: 400,
    });
  }

  // B. Sensitive Route Auditing
  if (isSensitiveRoute(path)) {
    console.log(
      `[AUDIT] Sensitive route accessed: ${path} | IP: ${ip} | User-Agent: ${userAgent}`,
    );
    if (userAgent === "unknown" || userAgent.trim() === "") {
      return new NextResponse("Access Denied: Missing User-Agent header.", {
        status: 400,
      });
    }
  }

  // C. Origin Whitelisting Validation
  const origin = request.headers.get("origin");
  if (origin && !SECURITY_CONFIG.ALLOWED_ORIGINS.includes(origin)) {
    return new NextResponse("Access Denied: Unauthorized Connection Origin.", {
      status: 403,
    });
  }

  const hasSession = request.cookies.get("has_session")?.value === "true";
  const role = request.cookies.get("role")?.value;

  // Find if the path is managed under our restricted sidebar items
  const matchingItem = sidebarConfig.find(
    (item) => path === item.url || path.startsWith(item.url + "/"),
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
  if (
    hasSession &&
    matchingItem &&
    !matchingItem.roles.includes(role as UserRole)
  ) {
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
    "/api/:path*",
  ],
};
