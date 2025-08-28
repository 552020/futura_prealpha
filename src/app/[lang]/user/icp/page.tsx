"use client";

import { useAuthGuard } from "@/utils/authentication";

import { useState, useEffect, useRef } from "react";
import type { BackendActor } from "@/ic/backend";

// Prevent static generation of this page
export const dynamic = 'force-dynamic';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuthClient as getIiAuthClient, loginWithII, clearIiSession } from "@/ic/ii";
import RequireAuth from "@/components/require-auth";

export default function ICPPage() {
  const { isAuthorized, isLoading } = useAuthGuard();
  const [greeting, setGreeting] = useState("");
  const [whoamiResult, setWhoamiResult] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principalId, setPrincipalId] = useState("");
  // UX safety: prevents double-clicks and provides visual feedback
  const [busy, setBusy] = useState(false);
  const [isRehydrating, setIsRehydrating] = useState(true);
  const { toast } = useToast();

  /**
   * AuthClient Persistence Optimization
   *
   * Problem: AuthClient.create() reads from IndexedDB every time it's called.
   * When called multiple times (login, whoami, logout, auth check), this causes:
   * - Multiple expensive IndexedDB reads
   * - Potential race conditions with concurrent reads
   * - Popup conflicts when multiple AuthClient instances exist
   *
   * Solution: Create AuthClient once and reuse the same instance.
   * The AuthClient internally manages the IndexedDB state and identity,
   * so we only need one instance per component lifecycle.
   *
   * What we're persisting:
   * - The AuthClient object (in React component memory via useRef)
   * - NOT the identity itself (that's still stored in browser IndexedDB by AuthClient)
   *
   * The AuthClient.create() still reads the stored identity from IndexedDB,
   * but we only do this expensive operation once instead of 4+ times.
   */
  // Cache authenticated actor to avoid recreating it for each backend call
  const authenticatedActorRef = useRef<BackendActor | null>(null);

  // Helper to obtain the shared II AuthClient instance
  const getAuthClient = async () => getIiAuthClient();

  // Helper function to get or create authenticated actor
  const getAuthenticatedActor = async (): Promise<BackendActor> => {
    const authClient = await getAuthClient();
    const isAuth = await authClient.isAuthenticated();

    if (!isAuth) {
      throw new Error("Not authenticated - please login first");
    }

    // If we have a cached actor, return it
    if (authenticatedActorRef.current) {
      return authenticatedActorRef.current;
    }

    // Create and cache new authenticated actor
    const identity = authClient.getIdentity();
    const { backendActor } = await import("@/ic/backend");
    authenticatedActorRef.current = await backendActor(identity);
    return authenticatedActorRef.current;
  };

  // Clear cached actor when user signs out
  const clearAuthenticatedActor = () => {
    authenticatedActorRef.current = null;
  };

  // Copy principal ID to clipboard
  const copyPrincipalToClipboard = async () => {
    if (principalId) {
      try {
        await navigator.clipboard.writeText(principalId);
        toast({
          title: "Copied!",
          description: "Principal ID copied to clipboard",
        });
      } catch (error) {
        console.error("Failed to copy:", error);
        toast({
          title: "Copy Failed",
          description: "Failed to copy principal ID to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  // Check authentication state on mount to persist across page reloads
  useEffect(() => {
    async function checkAuthState() {
      try {
        const authClient = await getAuthClient();
        const isAuth = await authClient.isAuthenticated();

        if (isAuth) {
          setIsAuthenticated(true);

          // Get the user's principal
          const identity = authClient.getIdentity();
          const principal = identity.getPrincipal();
          setPrincipalId(principal.toString());
          setGreeting("You are signed in!");

          // Rehydrate actor so "Test Backend" works immediately after refresh
          try {
            const { backendActor } = await import("@/ic/backend");
            const actor = await backendActor(identity);
            authenticatedActorRef.current = actor;
          } catch (error) {
            console.error("Failed to rehydrate actor:", error);
            // Don't break the flow if actor creation fails
          }
        }
      } catch (error) {
        console.error("Failed to check auth state:", error);
        // Don't show toast on mount errors - just log them
      } finally {
        setIsRehydrating(false);
      }
    }

    checkAuthState();
  }, []);
  async function handleGreetSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return; // UX safety: prevent double-clicks
    setBusy(true);
    try {
      const formData = new FormData(event.currentTarget);
      const name = formData.get("name") as string;

      const { backendActor } = await import("@/ic/backend");
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
      const { identity, principal } = await loginWithII();

      // Create and cache the authenticated actor
      const { backendActor } = await import("@/ic/backend");
      const authenticatedActor: BackendActor = await backendActor(identity);
      authenticatedActorRef.current = authenticatedActor; // Cache it for future use
      setPrincipalId(principal.toString());
      setGreeting("Successfully authenticated with Internet Identity!");
      setIsAuthenticated(true);

      toast({
        title: "Login Successful",
        description: "Successfully authenticated with Internet Identity!",
      });
    } catch (error) {
      console.error("Login failed:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: "Login Failed",
        description: `Failed to authenticate with Internet Identity: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleWhoami() {
    if (busy) return; // UX safety: prevent double-clicks
    setBusy(true);
    try {
      const authClient = await getAuthClient();
      const isAuthenticated = await authClient.isAuthenticated();

      if (!isAuthenticated) {
        toast({
          title: "Not Authenticated",
          description: "Please login first to call whoami",
          variant: "destructive",
        });
        return;
      }

      // Use cached authenticated actor
      const authenticatedActor = await getAuthenticatedActor();
      const backendPrincipal = await authenticatedActor.whoami();
      setWhoamiResult(`Backend whoami result: ${backendPrincipal.toString()}`);
    } catch (error) {
      console.error("Whoami failed:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Handle expired/invalid delegation
      if (
        errorMessage.includes("Invalid delegation") ||
        errorMessage.includes("expired") ||
        errorMessage.includes("401")
      ) {
        console.log("Delegation expired, prompting re-login");
        setIsAuthenticated(false);
        setPrincipalId("");
        setGreeting("");
        clearAuthenticatedActor();
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please sign in again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Whoami Failed",
        description: `Failed to get principal from backend: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    if (busy) return;
    setBusy(true);
    try {
      await clearIiSession();
      // Clear our cached actor
      clearAuthenticatedActor(); // Clear our cached actor

      setIsAuthenticated(false);
      setPrincipalId("");
      setGreeting("");
      setWhoamiResult("");
      toast({
        title: "Signed Out",
        description: "Successfully signed out",
      });
    } catch (error) {
      console.error("Sign out failed:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: "Sign Out Failed",
        description: `Failed to sign out: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  if (!isAuthorized || isLoading) {
    // Show loading spinner only while status is loading
    if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-800 dark:border-gray-700 dark:border-t-gray-200" />
        </div>
      );
    }

    // Show access denied for unauthenticated users
    return <RequireAuth />;
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">Hello ICP</h1>

      <div className="mb-6 flex gap-4">
        <Button onClick={isAuthenticated ? handleSignOut : handleLogin} id="login" disabled={busy}>
          {isAuthenticated ? "Sign Out" : "Continue with Internet Identity"}
        </Button>
        <Button onClick={handleWhoami} disabled={busy || !isAuthenticated || isRehydrating}>
          Test Backend Connection
        </Button>
      </div>

      {/* Principal ID Display */}
      {isAuthenticated && principalId && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Your Internet Identity Principal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                value={principalId}
                readOnly
                className="font-mono text-sm"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyPrincipalToClipboard}
                disabled={busy}
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleGreetSubmit} className="mb-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Enter your name:</Label>
          <div className="flex gap-4">
            <Input id="name" name="name" type="text" placeholder="Your name" className="w-64" />
            <Button type="submit" disabled={busy}>
              Send Greeting
            </Button>
          </div>
        </div>
      </form>

      {greeting && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <p>{greeting}</p>
          </CardContent>
        </Card>
      )}

      {whoamiResult && (
        <Card>
          <CardContent className="pt-6">
            <p>{whoamiResult}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
