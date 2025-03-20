import NextAuth from "next-auth";
import "next-auth/jwt";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db/db";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt"; // make sure bcrypt is installed

declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Early return with type narrowing
        if (
          !credentials?.email ||
          !credentials?.password ||
          typeof credentials.email !== "string" ||
          typeof credentials.password !== "string"
        ) {
          return null;
        }

        const email = credentials.email; // TypeScript now knows this is a string
        const password = credentials.password; // TypeScript now knows this is a string

        const user = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.email, email),
        });

        if (!user || !user.password) return null;

        // Compare passwords
        const passwordMatch = await compare(password, user.password);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      console.log("NextAuth redirect callback called with:", { url, baseUrl });
      console.log(`Redirecting to profile: ${baseUrl}/user/profile`);
      return `${baseUrl}/user/profile`;
    },

    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;
      console.log("NextAuth authorized callback called with pathname:", pathname);

      const protectedPatterns = ["/admin", "/user/"];
      const isProtectedPath = protectedPatterns.some((pattern) => pathname.startsWith(pattern));

      console.log("Is protected path:", isProtectedPath, "Auth exists:", !!auth);

      if (isProtectedPath) return !!auth;
      return true;
    },

    jwt({ token, account }) {
      console.log("NextAuth JWT callback called with token:", token);

      if (account?.access_token) {
        token.accessToken = account.access_token;
        console.log("Added access token to JWT");
      }
      return token;
    },

    session({ session, token }) {
      console.log("NextAuth session callback called with session:", session);

      if (session.user && token.sub) {
        session.user.id = token.sub;
        console.log("Added user ID to session:", token.sub);
      }
      if (token.accessToken) {
        session.accessToken = token.accessToken;
        console.log("Added access token to session");
      }
      return session;
    },
  },
  debug: true,
});
