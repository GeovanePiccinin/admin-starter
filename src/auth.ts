import argon2 from "argon2";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit/audit-log";
import {
  enforceLoginRateLimit,
  RateLimitExceededError,
} from "@/lib/rate-limit/rate-limit";

export const { auth, handlers, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials, request) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const forwardedAddress =
          request.headers.get("x-vercel-forwarded-for") ??
          request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ??
          request.headers.get("x-real-ip") ??
          undefined;

        try {
          await enforceLoginRateLimit(email, forwardedAddress);
        } catch (error: unknown) {
          if (error instanceof RateLimitExceededError) {
            return null;
          }
          throw error;
        }

        const user = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        if (!user) {
          return null;
        }

        const passwordIsValid = await argon2.verify(
          user.passwordHash,
          password,
        );

        if (!passwordIsValid) {
          return null;
        }

        await writeAuditLog({
          tenantId: user.tenantId,
          actorId: user.id,
          action: "login",
          entity: "User",
          entityId: user.id,
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          tenantId: user.tenantId,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.tenantId = user.tenantId;
      }

      return token;
    },

    async session({ session, token }) {
      if (!token.sub || typeof token.tenantId !== "string") {
        return session;
      }

      session.user.id = token.sub;
      session.user.tenantId = token.tenantId;

      return session;
    },
  },
});
