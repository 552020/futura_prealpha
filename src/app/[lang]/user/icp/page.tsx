"use client";

import { useAuthGuard } from "@/utils/authentication";

import { useState } from "react";
import { backendActor } from "@/ic/backend";
import type { BackendActor } from "@/ic/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AuthClient } from "@dfinity/auth-client";
import { useToast } from "@/hooks/use-toast";

export default function ICPPage() {
  const { isAuthorized, isLoading } = useAuthGuard();
  const [greeting, setGreeting] = useState("");
  // UX safety: prevents double-clicks and provides visual feedback
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  async function handleGreetSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return; // UX safety: prevent double-clicks
    setBusy(true);
    try {
      const formData = new FormData(event.currentTarget);
      const name = formData.get("name") as string;

      const actor: BackendActor = await backendActor();

      const greeting = await actor.greet(name);

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
      const provider = process.env.NEXT_PUBLIC_II_URL || process.env.NEXT_PUBLIC_II_URL_FALLBACK;
      if (!provider) throw new Error("II URL not configured");

      const authClient = await AuthClient.create();
      await new Promise<void>((resolve, reject) => {
        authClient.login({
          identityProvider: provider,
          onSuccess: resolve,
          onError: reject,
        });
      });

      // At this point we're authenticated, and we can get the identity from the auth client:
      const identity = authClient.getIdentity();
      console.log("identity", identity);
      const authenticatedActor: BackendActor = await backendActor(identity);
      console.log("AuthenticatedActor", authenticatedActor);
      const greeting = await authenticatedActor.greet("John");
      console.log("Greeting", greeting);
      setGreeting(greeting);

      toast({
        title: "Login Successful",
        description: "Successfully authenticated with Internet Identity!",
      });
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        title: "Login Failed",
        description: "Failed to authenticate with Internet Identity. Please try again.",
        variant: "destructive",
      });
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
