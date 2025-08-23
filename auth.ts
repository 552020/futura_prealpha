// import NextAuth, { DefaultSession } from "next-auth";

import NextAuth, { type DefaultSession } from "next-auth";
import "next-auth/jwt";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db/db";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt"; // make sure bcrypt is installed
import { allUsers, temporaryUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

// console.log("--------------------------------");
// console.log("auth.ts");
// console.log("--------------------------------");
// console.log("NODE_ENV:", process.env.NODE_ENV);

declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    accessToken?: string;
    user: User & {
      id: string;
      businessUserId?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    /** Add role to JWT */
    role?: string;
    businessUserId?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
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
        // console.log("--------------------------------");
        // console.log("Google profile:", profile);
        // console.log("--------------------------------");
        return {
          id: profile.sub, // ✅ crucial line!
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          role: "user",
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
    // async redirect({ url, baseUrl }) {
    //   if (process.env.NODE_ENV === "development") {
    //     console.log("NextAuth redirect callback called with:", { url, baseUrl });
    //     console.log(`Redirecting to profile: ${baseUrl}/user/profile`);
    //   }
    //   return `${baseUrl}/user/profile`;
    // },
    redirect({ url, baseUrl }) {
      const isLoginFlow = url.includes("/api/auth/signin") || url.includes("/api/auth/callback");

      if (isLoginFlow) {
        // Extract language from URL if available, default to 'en'
        const urlObj = new URL(url);
        const lang = urlObj.searchParams.get("lang") || "en";
        const redirectTo = `${baseUrl}/${lang}/vault`;
        // console.log("[NextAuth] Redirecting after login:", redirectTo);
        return redirectTo;
      }

      // Otherwise just return the same URL (no redirect)
      return url;
    },

    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;
      // console.log("NextAuth authorized callback called with pathname:", pathname);

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

    async jwt({ token, account, user }) {
      //   console.log("--------------------------------");
      //   console.log("NextAuth JWT callback called with token:", token);
      //   console.log("NextAuth JWT callback called with account:", account);
      //   console.log("NextAuth JWT callback called with user:", user);
      //   console.log("--------------------------------");

      if (account?.access_token) {
        token.accessToken = account.access_token;
        // console.log("Added access token to JWT");
      }
      // On first sign-in
      if (user?.role) {
        token.role = user.role;
        // console.log("Added role to JWT from user object:", token.role);
      }
      //   if (user) {
      //     token.role = user.role;
      //     console.log("Added role to JWT:", token.role);
      //   }
      // On subsequent requests
      if (!token.role && token.sub) {
        const dbUser = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, token.sub as string),
        });

        if (dbUser) {
          token.role = dbUser.role;
          // console.log("Fetched role from DB and added to JWT:", token.role);
        } else {
          token.role = "user";
          // console.log("Fallback role set to 'user'");
        }
      }

      // Add business user ID lookup
      if (user?.id && !token.businessUserId) {
        try {
          const allUser = await db.query.allUsers.findFirst({
            where: (allUsers, { eq }) => eq(allUsers.userId, user.id!),
            columns: { id: true },
          });
          if (allUser?.id) {
            token.businessUserId = allUser.id;
            console.log("[Auth] ✅ Business user ID added to token:", {
              authUserId: user.id,
              businessUserId: allUser.id,
            });
          } else {
            console.warn("[Auth] ⚠️ No allUsers entry found for Auth.js user:", user.id);
          }
        } catch (error) {
          console.error("[Auth] ❌ Error looking up business user ID:", error);
        }
      }

      return token;
    },

    session({ session, token }) {
      //   console.log("--------------------------------");
      //   console.log("NextAuth session callback called with session:", session);
      //   console.log("NextAuth session callback called with token:", token);
      //   console.log("--------------------------------");

      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.sub as string;

        // Add business user ID
        if (token.businessUserId && typeof token.businessUserId === "string") {
          (session.user as { businessUserId?: string }).businessUserId = token.businessUserId;
        }
      }
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  debug: true,
  events: {
    async createUser({ user }) {
      // console.log("[Auth] ✅ User created:", user);

      // Check if there's a temporary user with the same email
      const temporaryUser = await db.query.temporaryUsers.findFirst({
        where: (temporaryUsers, { eq }) => eq(temporaryUsers.email, user.email!),
      });

      // Find the corresponding allUsers entry if temporary user exists
      const allUserEntry = temporaryUser
        ? await db.query.allUsers.findFirst({
            where: (allUsers, { eq }) => eq(allUsers.temporaryUserId, temporaryUser.id),
          })
        : null;

      if (temporaryUser && allUserEntry) {
        // console.log("[Auth] 🚀 Promoting temporary user to permanent user:", {
        //   temporaryUserId: temporaryUser.id,
        //   newUserId: user.id,
        //   allUserId: allUserEntry.id,
        //   email: user.email,
        // });

        // Update the allUsers entry to point to the new permanent user
        await db
          .update(allUsers)
          .set({
            type: "user",
            userId: user.id,
            temporaryUserId: null,
          })
          .where(eq(allUsers.id, allUserEntry.id));

        // Delete the temporary user since we've migrated their data
        await db.delete(temporaryUsers).where(eq(temporaryUsers.id, temporaryUser.id));

        console.log("[Auth] ✅ Successfully promoted user");
      } else if (temporaryUser) {
        // console.log("[Auth] ⚠️ Found temporary user but no corresponding allUsers entry:", {
        //   temporaryUserId: temporaryUser.id,
        //   email: user.email,
        // });
      } else {
        // No temporary user found, create a new allUsers entry
        console.log("[Auth] 🆕 Creating new allUsers entry for:", {
          userId: user.id,
          email: user.email,
        });

        await db.insert(allUsers).values({
          type: "user",
          userId: user.id,
        });

        console.log("[Auth] ✅ Successfully created allUsers entry");
      }
    },
    async linkAccount(account) {
      console.log("[Auth] 🔗 Account linked:", account);
    },
    async signIn({ user, account, profile }) {
      console.log("[Auth] 👋 User signed in:", { user, account, profile });
    },
    async signOut(message) {
      if ("session" in message) {
        console.log("[Auth] User signed out, session object:", message.session);
      } else if ("token" in message) {
        console.log("[Auth] User signed out, JWT token:", message.token);
      }
    },
  },
});
