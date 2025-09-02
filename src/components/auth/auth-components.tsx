u/ import { signIn, signOut } from "../../auth";
// import { Button } from "@/components/ui/button";

// export function SignIn({ provider, ...props }: { provider?: string } & React.ComponentPropsWithRef<typeof Button>) {
//   return (
//     <form
//       action={async () => {
//         "use server";
//         await signIn(provider);
//       }}
//     >
//       <Button {...props}>Sign In</Button>
//     </form>
//   );
// }

// export function SignOut(props: React.ComponentPropsWithRef<typeof Button>) {
//   return (
//     <form
//       action={async () => {
//         "use server";
//         await signOut();
//       }}
//       className="w-full"
//     >
//       <Button variant="ghost" className="w-full p-0" {...props}>
//         Sign Out
//       </Button>
//     </form>
//   );
// }

"use client"; // Ensure this runs on the client

import { signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { clearIiSession } from "@/ic/ii";

export function SignIn({ provider, ...props }: { provider?: string } & React.ComponentPropsWithRef<typeof Button>) {
  return (
    <Button {...props} onClick={() => signIn(provider)}>
      Sign In
    </Button>
  );
}

export function SignOut(props: React.ComponentPropsWithRef<typeof Button>) {
  return (
    <Button
      variant="ghost"
      className="w-full p-0"
      {...props}
      onClick={async () => {
        try {
          await clearIiSession();
        } catch {
          // ignore
        } finally {
          await signOut({ callbackUrl: "/", redirect: true });
        }
      }}
    >
      Sign Out
    </Button>
  );
}
