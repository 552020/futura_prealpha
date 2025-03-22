// import NextAuth, { DefaultSession } from "next-auth";

import NextAuth, { type DefaultSession } from "next-auth";
import "next-auth/jwt";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db/db";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt"; // make sure bcrypt is installed

declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    accessToken?: string;
    user: User & {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    /** Add role to JWT */
    role?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "database" },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          email: profile.email,
          name: profile.name,
          image: profile.avatar_url,
          role: "user" as string,
        };
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      profile(profile) {
        console.log("Google profile:", profile);
        return {
          role: profile.role ?? "user", // Default role if not provided
          ...profile,
        };
      },
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
          role: user.role,
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

      // Tests route check
      if (pathname.startsWith("/tests")) {
        return ["admin", "superadmin", "developer"].includes(auth?.user?.role ?? "");
      }

      // Admin routes check
      if (pathname.startsWith("/admin")) {
        return ["admin", "superadmin"].includes(auth?.user?.role ?? "");
      }

      // Other protected routes
      if (pathname.startsWith("/user/")) {
        return !!auth;
      }

      return true;
    },

    jwt({ token, account, user }) {
      console.log("NextAuth JWT callback called with token:", token);

      if (account?.access_token) {
        token.accessToken = account.access_token;
        console.log("Added access token to JWT");
      }
      if (user) {
        token.role = user.role;
        console.log("Added role to JWT:", token.role);
      }
      return token;
    },

    session({ session, token }) {
      console.log("NextAuth session callback called with session:", session);

      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.sub as string;
      }
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  debug: true,
});
