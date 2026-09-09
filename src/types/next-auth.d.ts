import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: string[];
    } & DefaultSession["user"];
  }

  interface User {
    roles: string[];
    sessionVersion: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    roles?: string[];
    sessionVersion?: number;
    blocked?: boolean;
  }
}
