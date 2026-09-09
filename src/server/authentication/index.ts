import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/server/database/prisma";
import { loginSchema } from "@/server/validation/auth";

export const { auth, handlers, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const result = loginSchema.safeParse(credentials);

        if (!result.success) return null;

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
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roles = Array.isArray(token.roles)
          ? token.roles.filter((role): role is string => typeof role === "string")
          : [];
      }
      return session;
    },
  },
});
