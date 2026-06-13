import "@/lib/auth-url";
import type { NextAuthConfig } from "next-auth";
import {
  canAccessAdminPanel,
  getDefaultAdminPath,
  isPathAllowedForRole,
} from "@/lib/roles";

export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const isLoginPage = pathname === "/admin/login";
      const isAdminPanel = pathname.startsWith("/admin") && !isLoginPage;

      if (isAdminPanel && !isLoggedIn) return false;

      if (isLoginPage && isLoggedIn) return true;

      if (isAdminPanel && isLoggedIn) {
        const role = auth.user?.role;
        if (!canAccessAdminPanel(role)) return false;
        if (!isPathAllowedForRole(pathname, role)) {
          return Response.redirect(new URL(getDefaultAdminPath(role), request.nextUrl));
        }
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
