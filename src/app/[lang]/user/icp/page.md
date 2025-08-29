```ts
"use client";

import { useAuthGuard } from "@/utils/authentication";

import { useState } from "react";
import { backendActor } from "@/ic/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AuthClient } from "@dfinity/auth-client";

export default function ICPPage() {
  const { isAuthorized, isLoading } = useAuthGuard();
  const [greeting, setGreeting] = useState("");
  // UX safety: prevents double-clicks and provides visual feedback during async operations
  const [busy, setBusy] = useState(false);

  /**
   * Handle form submission for ICP greeting.
   *
   * CHANGES FROM ORIGINAL:
   * - Made function async because backendActor() now returns a Promise
   * - Original: backend.greet(name).then(...) - used pre-configured actor
   * - New: await backendActor() then await actor.greet(name) - creates actor on demand
   *
   * Why async? Our custom backendActor() function is async because:
   * 1. Agent creation is async (HttpAgent.create() returns Promise)
   * 2. We need to await the agent before creating the actor
   * 3. This ensures proper initialization before making canister calls
   */
  async function handleGreetSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return; // UX safety: prevent double-clicks
    setBusy(true);
    try {
      const formData = new FormData(event.currentTarget);
      const name = formData.get("name") as string;

      // ORIGINAL CODE (commented out):
      // backend.greet(name).then((greeting) => {
      //   setGreeting(greeting);
      // });

      // NEW CODE - Custom actor creation:
      // 1. Create actor instance on demand (replaces pre-configured 'backend' export)
      const actor = (await backendActor()) as { greet: (name: string) => Promise<string> };

      // 2. Call the canister method (same as before, but with our custom actor)
      const greeting = await actor.greet(name);

      // 3. Update UI (same as before)
      setGreeting(greeting);
    } finally {
      setBusy(false);
    }
  }
  async function handleLogin() {
    if (busy) return; // UX safety: prevent double-clicks
    setBusy(true);
    try {
      console.log("handleLogin");
      const authClient = await AuthClient.create();
      await new Promise((resolve) => {
        authClient.login({
          // identityProvider: process.env.NEXT_PUBLIC_II_URL,
          identityProvider: process.env.NEXT_PUBLIC_II_URL || process.env.NEXT_PUBLIC_II_URL_FALLBACK,
          onSuccess: resolve,
        });
      });

      // At this point we're authenticated, and we can get the identity from the auth client:
      const identity = authClient.getIdentity();
      console.log("identity", identity);
      // My actor already create the agent so we dont need to create it
      // const agent = await createAgent();
      // console.log("agent", agent);
      const authenticatedActor = (await backendActor(identity)) as { greet: (name: string) => Promise<string> };
      console.log("AuthenticatedActor", authenticatedActor);
      const greeting = await authenticatedActor.greet("John");
      console.log("Greeting", greeting);
    } finally {
      setBusy(false);
    }
  }

  if (!isAuthorized || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-800 dark:border-gray-700 dark:border-t-gray-200" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">Hello ICP</h1>

      <div className="mb-6">
        <Button onClick={handleLogin} id="login" className="mb-4" disabled={busy}>
          Login!
        </Button>
      </div>

      <form onSubmit={handleGreetSubmit} className="mb-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Enter your name:</Label>
          <div className="flex gap-2">
            <Input id="name" name="name" type="text" placeholder="Your name" className="w-64" />
            <Button type="submit" disabled={busy}>
              Click Me!
            </Button>
          </div>
        </div>
      </form>

      {greeting && (
        <Card>
          <CardContent className="pt-6">
            <p>{greeting}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```
