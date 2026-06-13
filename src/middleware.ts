import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  canAccessAdminPanel,
  getDefaultAdminPath,
  isPathAllowedForRole,
} from "@/lib/roles-edge";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/admin/login";
  const isAdminPanel = pathname.startsWith("/admin") && !isLoginPage;

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const isLoggedIn = !!token;
  const role = token?.role as string | undefined;

  if (isAdminPanel && !isLoggedIn) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL(getDefaultAdminPath(role), request.url));
  }

  if (isAdminPanel && isLoggedIn) {
    if (!canAccessAdminPanel(role)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (!isPathAllowedForRole(pathname, role)) {
      return NextResponse.redirect(new URL(getDefaultAdminPath(role), request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
