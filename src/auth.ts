import "@/lib/auth-url";
import { cache } from "react";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";

const nextAuth = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email?.trim() || !password) return null;

        try {
          const user = await prisma.user.findUnique({ where: { email: email.trim() } });
          if (!user) return null;

          // Legacy seed used plain text "placeholder" before bcrypt
          if (user.passwordHash === "placeholder" && password === "admin123") {
            const passwordHash = await bcrypt.hash(password, 10);
            await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            };
          }

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (err) {
          console.error("[auth] authorize error:", err);
          return null;
        }
      },
    }),
  ],
});

export const { handlers, signIn, signOut } = nextAuth;

/** Dedup auth() dalam satu RSC request (layout + page + header). */
export const auth = cache(nextAuth.auth);
