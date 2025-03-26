import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db/db";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { allUsers, temporaryUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

// Helper function to wait for user to be available in the database
async function waitForUser(userId: string, maxRetries = 12, initialDelayMs = 500): Promise<true> {
  for (let i = 0; i < maxRetries; i++) {
    console.log(`[Auth] 🔄 Attempt ${i + 1}/${maxRetries} to verify user existence (userId: ${userId})`);
    const user = await db.query.users.findFirst({
      where: (usersTable, { eq }) => eq(usersTable.id, userId as string),
    });

    if (user) {
      console.log(`[Auth] ✅ User found in database on attempt ${i + 1}:`, {
        id: user.id,
        email: user.email,
      });
      return true;
    }

    const delayMs = initialDelayMs * Math.pow(2, i); // Exponential backoff
    console.log(`[Auth] ⏳ User not found on attempt ${i + 1}, waiting ${delayMs}ms before retry`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  const totalWaitTime = Array.from({ length: maxRetries }).reduce(
    (sum: number, _, i) => sum + initialDelayMs * Math.pow(2, i),
    0
  );

  const error = `User ${userId} not found in database after ${maxRetries} retries over ${totalWaitTime}ms total wait time`;
  console.error(`[Auth] ❌ ${error}`);
  throw new Error(error);
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
        return {
          id: profile.sub,
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
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const user = await db.query.users.findFirst({
          where: (usersTable, { eq }) => eq(usersTable.email, email),
        });
        if (!user || !user.password) return null;
        const passwordMatch = await compare(credentials.password as string, user.password);
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
    async jwt({ token, user }) {
      if (user?.role) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.sub as string;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      console.log("[Auth] ⭐️ Starting createUser event with user:", {
        id: user.id,
        email: user.email,
        name: user.name,
      });

      try {
        // Check if there's a temporary user with the same email
        const temporaryUser = await db.query.temporaryUsers.findFirst({
          where: (temporaryUsers, { eq }) => eq(temporaryUsers.email, user.email!),
        });
        console.log("[Auth] 🔍 Temporary user check:", temporaryUser ? "Found" : "Not Found");

        // Find the corresponding allUsers entry if temporary user exists
        const allUserEntry = temporaryUser
          ? await db.query.allUsers.findFirst({
              where: (allUsers, { eq }) => eq(allUsers.temporaryUserId, temporaryUser.id),
            })
          : null;
        console.log("[Auth] 🔍 Existing allUsers entry:", allUserEntry ? "Found" : "Not Found");

        if (temporaryUser && allUserEntry) {
          console.log("[Auth] 🚀 Promoting temporary user to permanent user:", {
            temporaryUserId: temporaryUser.id,
            newUserId: user.id,
            allUserId: allUserEntry.id,
            email: user.email,
          });

          // Wait for user to be available before updating
          await waitForUser(user.id!);

          // Update the allUsers entry to point to the new permanent user
          await db
            .update(allUsers)
            .set({
              type: "user",
              userId: user.id!,
              temporaryUserId: null,
            })
            .where(eq(allUsers.id, allUserEntry.id));
          console.log("[Auth] ✅ Successfully updated allUsers entry");

          // Delete the temporary user since we've migrated their data
          await db.delete(temporaryUsers).where(eq(temporaryUsers.id, temporaryUser.id));
          console.log("[Auth] ✅ Successfully deleted temporary user");
        } else {
          console.log("[Auth] 🆕 Attempting to create new allUsers entry for:", {
            userId: user.id,
            email: user.email,
          });

          // Wait for user to be available before creating allUsers entry
          await waitForUser(user.id!);

          const [newAllUser] = await db
            .insert(allUsers)
            .values({
              type: "user",
              userId: user.id!,
            })
            .returning();

          console.log("[Auth] ✅ Successfully created allUsers entry:", newAllUser);
        }
      } catch (error) {
        console.error("[Auth] ❌ Error in createUser event:", error);
        throw error;
      }
    },
    async linkAccount(account) {
      console.log("[Auth] 🔗 Account linked:", account);
    },
    async signIn({ user, account, profile }) {
      console.log("[Auth] 👋 User signed in:", { user, account, profile });
    },
  },
});
