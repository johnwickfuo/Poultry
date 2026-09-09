import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/server/database/prisma";
import { loginSchema } from "@/server/validation/auth";
import { consumeRateLimit } from "./rate-limit";
import { getIpFromHeaders } from "./request";

export const { auth, handlers, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const result = loginSchema.safeParse(credentials);

        if (!result.success) return null;

        const ip = getIpFromHeaders(request.headers);
        const [accountLimit, ipLimit] = await Promise.all([
          consumeRateLimit("login-account", `${ip}:${result.data.email}`, {
            limit: 5,
            windowMs: 15 * 60 * 1000,
          }),
          consumeRateLimit("login-ip", ip, {
            limit: 20,
            windowMs: 15 * 60 * 1000,
          }),
        ]);

        if (!accountLimit.allowed || !ipLimit.allowed) return null;

        const user = await prisma.user.findFirst({
          where: {
            email: result.data.email,
            status: "ACTIVE",
            deletedAt: null,
          },
          include: { roles: { include: { role: true } } },
        });

        if (!user?.passwordHash) return null;

        const passwordMatches = await compare(
          result.data.password,
          user.passwordHash,
        );

        if (!passwordMatches) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          roles: user.roles.map(({ role }) => role.name),
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
        token.sessionVersion = user.sessionVersion;
        token.blocked = false;
        return token;
      }

      const userId = typeof token.id === "string" ? token.id : null;
      if (!userId) return token;

      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { status: true, deletedAt: true, sessionVersion: true },
      });

      const isBlocked =
        !currentUser ||
        currentUser.status !== "ACTIVE" ||
        Boolean(currentUser.deletedAt) ||
        currentUser.sessionVersion !== token.sessionVersion;

      if (isBlocked) {
        token.id = undefined;
        token.roles = [];
        token.blocked = true;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : "";
        session.user.roles = Array.isArray(token.roles)
          ? token.roles.filter((role): role is string => typeof role === "string")
          : [];
      }
      return session;
    },
  },
});
