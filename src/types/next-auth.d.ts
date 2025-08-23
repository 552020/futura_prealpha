import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      businessUserId?: string;
    } & DefaultSession["user"];
  }

  interface JWT {
    businessUserId?: string;
  }
}
