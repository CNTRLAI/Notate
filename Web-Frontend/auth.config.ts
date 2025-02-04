import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { LoginSchema } from "@/src/schemas/loginSchema";
import { getUserByEmail } from "@/src/data/user";
import bcrypt from "bcryptjs";
/* import Google from "next-auth/providers/google";
import Github from "next-auth/providers/github";
import LinkedInProvider from "next-auth/providers/linkedin"; */

export default {
  providers: [
    /*     Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Github({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      authorization: {
        params: { scope: "openid profile email" },
      },
    }), */
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;
          const user = await getUserByEmail(email);

          if (!user || !user.password) return null;

          const passwordMatch = await bcrypt.compare(password, user.password);
          if (passwordMatch) {
            return {
              ...user,
              id: user.user_id.toString(),
            };
          }
        }
        return null;
      },
    }),
  ],
  trustHost: true,
} as NextAuthConfig;
