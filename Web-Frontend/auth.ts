import NextAuth, { DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import authConfig from "@/auth.config";
import { prisma } from "@/prisma";
import * as jose from "jose";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string | unknown;
      accountType: string | unknown;
      authToken?: string | unknown;
    } & DefaultSession["user"];
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  pages: {
    signIn: "/signin",
    error: "/error",
  },
  callbacks: {
    async signIn() {
      return true;
    },
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        if (token.role) {
          session.user.role = token.role;
        }
        session.user.authToken = token.jwt;
      }
      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;
      token.id = token.sub;
      const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
      const authToken = await new jose.SignJWT({ userId: token.sub })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("1h")
        .sign(secret);
      token.jwt = authToken;
      token.authToken = authToken;
      return token;
    },
  },
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
});
