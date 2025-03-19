import NextAuth from "next-auth";
import "next-auth/jwt";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db/db";

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
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      console.log("NextAuth redirect callback called with:", { url, baseUrl });

      // Always redirect to the profile page after successful authentication
      // This takes precedence over other redirect rules
      console.log(`Redirecting to profile: ${baseUrl}/user/profile`);
      return `${baseUrl}/user/profile`;

      // The following code is now unreachable, but kept for reference
      // if (url.startsWith("/")) {
      //   console.log(`Returning: ${baseUrl}${url}`);
      //   return `${baseUrl}${url}`;
      // } else if (new URL(url).origin === baseUrl) {
      //   console.log(`Returning URL as is: ${url}`);
      //   return url;
      // }
      // return `${baseUrl}/user/profile`;
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
  //   debug: process.env.NODE_ENV !== "production",
  debug: true,
});
