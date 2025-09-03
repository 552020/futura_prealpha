"use client";

import { useAuthGuard } from "@/utils/authentication";

import { useState, useEffect, useRef } from "react";
import type { BackendActor } from "@/ic/backend";
import type { CapsuleInfo, Capsule, CapsuleHeader } from "@/ic/declarations/backend/backend.did";
import { Principal } from "@dfinity/principal";

// Prevent static generation of this page
export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuthClient as getIiAuthClient, loginWithII, clearIiSession } from "@/ic/ii";
import RequireAuth from "@/components/auth/require-auth";
import { LinkedAccounts } from "@/components/user/linked-accounts";
import { IICoAuthControls } from "@/components/user/ii-coauth-controls";

export default function ICPPage() {
  const { isAuthorized, isLoading } = useAuthGuard();
  const [greeting, setGreeting] = useState("");
  const [whoamiResult, setWhoamiResult] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principalId, setPrincipalId] = useState("");
  const [capsuleInfo, setCapsuleInfo] = useState<CapsuleInfo | null>(null);
  const [capsuleReadResult, setCapsuleReadResult] = useState<Capsule | null>(null);
  const [capsuleIdInput, setCapsuleIdInput] = useState("");
  const [showFullCapsule, setShowFullCapsule] = useState(false);
  const [fullCapsuleData, setFullCapsuleData] = useState<Capsule | null>(null);
  const [isLoadingFull, setIsLoadingFull] = useState(false);
  const [capsulesList, setCapsulesList] = useState<CapsuleHeader[]>([]);
  const [isLoadingCapsules, setIsLoadingCapsules] = useState(false);
  const [newCapsuleSubject, setNewCapsuleSubject] = useState("");
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

  // Fetch full capsule data
  const handleFetchFullCapsule = async () => {
    if (busy || !isAuthenticated || isRehydrating) return;

    setBusy(true);
    setIsLoadingFull(true);
    try {
      const authenticatedActor = await getAuthenticatedActor();
      const fullData = await authenticatedActor.capsules_read_full([]);

      if (fullData && fullData.length > 0 && fullData[0]) {
        setFullCapsuleData(fullData[0]);
        setShowFullCapsule(true);
        toast({
          title: "Full Capsule Data Loaded",
          description: "Successfully retrieved complete capsule information",
        });
      } else {
        toast({
          title: "No Full Data",
          description: "Could not retrieve full capsule data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch full capsule data:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: "Fetch Failed",
        description: `Failed to fetch full capsule data: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      setIsLoadingFull(false);
    }
  };

  // Toggle back to basic view
  const handleShowBasicCapsule = () => {
    setShowFullCapsule(false);
    setFullCapsuleData(null);
  };

  // Fetch capsules list
  const handleFetchCapsulesList = async () => {
    if (busy || !isAuthenticated || isRehydrating) return;

    setBusy(true);
    setIsLoadingCapsules(true);
    try {
      const authenticatedActor = await getAuthenticatedActor();
      const capsules = await authenticatedActor.capsules_list();

      setCapsulesList(capsules);
      toast({
        title: "Capsules List Loaded",
        description: `Found ${capsules.length} capsule(s)`,
      });
    } catch (error) {
      console.error("Failed to fetch capsules list:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: "Fetch Failed",
        description: `Failed to fetch capsules list: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      setIsLoadingCapsules(false);
    }
  };

  // Create new capsule
  const handleCreateCapsule = async () => {
    if (busy || !isAuthenticated || isRehydrating) return;

    setBusy(true);
    try {
      const authenticatedActor = await getAuthenticatedActor();
      const result = newCapsuleSubject.trim()
        ? await authenticatedActor.capsules_create([{ Principal: Principal.fromText(principalId) }])
        : await authenticatedActor.capsules_create([]);

      if (result.success) {
        setNewCapsuleSubject("");
        toast({
          title: "Capsule Created",
          description: result.message,
        });
        // Refresh capsules list
        handleFetchCapsulesList();
      } else {
        toast({
          title: "Creation Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to create capsule:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: "Creation Failed",
        description: `Failed to create capsule: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
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

      // Automatically fetch capsule info after successful login
      try {
        // console.log("Fetching capsule info after login...");
        const capsuleData = await authenticatedActor.capsules_read_basic([]);
        // console.log("Capsule data received:", capsuleData);
        setCapsuleInfo(capsuleData[0] || null);
        // console.log("Capsule info set to:", capsuleData[0] || null);
      } catch (error) {
        console.warn("Failed to fetch capsule info on login:", error);
        // Don't fail the login if capsule info fetch fails
      }

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
        // console.log("Delegation expired, prompting re-login");
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

  async function handleGetCapsuleInfo() {
    if (busy) return; // UX safety: prevent double-clicks
    setBusy(true);
    try {
      const authClient = await getAuthClient();
      const isAuthenticated = await authClient.isAuthenticated();

      if (!isAuthenticated) {
        toast({
          title: "Not Authenticated",
          description: "Please login first to get capsule info",
          variant: "destructive",
        });
        return;
      }

      // Use cached authenticated actor
      const authenticatedActor = await getAuthenticatedActor();
      const capsuleData = await authenticatedActor.capsules_read_basic([]);
      setCapsuleInfo(capsuleData[0] || null);

      if (capsuleData) {
        toast({
          title: "Capsule Info Retrieved",
          description: "Successfully fetched your capsule information",
        });
      } else {
        toast({
          title: "No Capsule Found",
          description: "You don't have a capsule yet. Register to create one.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Get capsule info failed:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Handle expired/invalid delegation
      if (
        errorMessage.includes("Invalid delegation") ||
        errorMessage.includes("expired") ||
        errorMessage.includes("401")
      ) {
        // console.log("Delegation expired, prompting re-login");
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
        title: "Get Capsule Info Failed",
        description: `Failed to get capsule info: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleReadCapsule() {
    if (busy) return; // UX safety: prevent double-clicks
    if (!capsuleIdInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a capsule ID",
        variant: "destructive",
      });
      return;
    }

    setBusy(true);
    try {
      const authClient = await getAuthClient();
      const isAuthenticated = await authClient.isAuthenticated();

      if (!isAuthenticated) {
        toast({
          title: "Not Authenticated",
          description: "Please login first to read capsule",
          variant: "destructive",
        });
        return;
      }

      // Use cached authenticated actor
      const authenticatedActor = await getAuthenticatedActor();
      const capsuleData = await authenticatedActor.capsules_read_full([capsuleIdInput.trim()]);
      setCapsuleReadResult(capsuleData[0] || null);

      if (capsuleData[0]) {
        toast({
          title: "Capsule Retrieved",
          description: "Successfully fetched capsule data",
        });
      } else {
        toast({
          title: "Capsule Not Found",
          description: "No capsule found with that ID, or you don't have access",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Read capsule failed:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Handle expired/invalid delegation
      if (
        errorMessage.includes("Invalid delegation") ||
        errorMessage.includes("expired") ||
        errorMessage.includes("401")
      ) {
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
        title: "Read Capsule Failed",
        description: `Failed to read capsule: ${errorMessage}`,
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
      setCapsuleInfo(null);
      setFullCapsuleData(null);
      setShowFullCapsule(false);
      setCapsulesList([]);
      setNewCapsuleSubject("");
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

  // Debug logging
  // console.log("Rendering ICP page, capsuleInfo:", capsuleInfo);

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">Hello ICP</h1>

      {/* II Co-Auth Controls - PROMINENTLY DISPLAYED FIRST */}
      <div className="mb-6">
        <IICoAuthControls />
      </div>

      {/* Linked Accounts Section */}
      <div className="mb-6">
        <LinkedAccounts showActions={true} />
      </div>

      <div className="mb-6 flex gap-4">
        <Button onClick={isAuthenticated ? handleSignOut : handleLogin} id="login" disabled={busy}>
          {isAuthenticated ? "Sign Out" : "Continue with Internet Identity"}
        </Button>
        <Button onClick={handleWhoami} disabled={busy || !isAuthenticated || isRehydrating}>
          Test Backend Connection
        </Button>
        <Button onClick={handleGetCapsuleInfo} disabled={busy || !isAuthenticated || isRehydrating}>
          Get Capsule Info
        </Button>
      </div>

      {/* Capsule Reading Section */}
      <div className="mb-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="capsuleId">Read Specific Capsule:</Label>
          <div className="flex gap-4">
            <Input
              id="capsuleId"
              value={capsuleIdInput}
              onChange={(e) => setCapsuleIdInput(e.target.value)}
              placeholder="Enter capsule ID (e.g., capsule_1234567890)"
              className="w-80"
            />
            <Button
              onClick={handleReadCapsule}
              disabled={busy || !isAuthenticated || isRehydrating || !capsuleIdInput.trim()}
            >
              Read Capsule
            </Button>
          </div>
        </div>
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

      {/* Capsule Information Display */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Capsule Information</span>
            {capsuleInfo && (
              <div className="flex gap-2">
                {!showFullCapsule ? (
                  <Button onClick={handleFetchFullCapsule} disabled={busy || isLoadingFull} variant="outline" size="sm">
                    {isLoadingFull ? "Loading..." : "📊 Show Full Data"}
                  </Button>
                ) : (
                  <Button onClick={handleShowBasicCapsule} disabled={busy} variant="outline" size="sm">
                    📋 Show Basic Data
                  </Button>
                )}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {capsuleInfo ? (
            <div className="space-y-4">
              {!showFullCapsule ? (
                // Basic Capsule Info View
                <>
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      💡 <strong>Basic View:</strong> Lightweight capsule information (fast loading)
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Capsule ID</Label>
                      <p className="text-sm text-muted-foreground font-mono">{capsuleInfo.capsule_id}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Subject</Label>
                      <p className="text-sm text-muted-foreground">
                        {"Principal" in capsuleInfo.subject
                          ? `Principal: ${capsuleInfo.subject.Principal}`
                          : `Opaque: ${capsuleInfo.subject.Opaque}`}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Is Owner</Label>
                      <p className="text-sm text-muted-foreground">{capsuleInfo.is_owner ? "Yes" : "No"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Is Controller</Label>
                      <p className="text-sm text-muted-foreground">{capsuleInfo.is_controller ? "Yes" : "No"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Is Self Capsule</Label>
                      <p className="text-sm text-muted-foreground">{capsuleInfo.is_self_capsule ? "Yes" : "No"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Bound to Web2</Label>
                      <p className="text-sm text-muted-foreground">{capsuleInfo.bound_to_web2 ? "Yes" : "No"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Created At</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(Number(capsuleInfo.created_at) / 1000000).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Updated At</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(Number(capsuleInfo.updated_at) / 1000000).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                // Full Capsule Data View
                <>
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      🚀 <strong>Full View:</strong> Complete capsule data including memories, galleries, and
                      connections
                    </p>
                  </div>
                  {fullCapsuleData ? (
                    <div className="space-y-6">
                      {/* Basic Info Section */}
                      <div>
                        <h4 className="font-medium mb-3 text-sm">Basic Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Capsule ID</Label>
                            <p className="text-sm text-muted-foreground font-mono">{fullCapsuleData.id}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Subject</Label>
                            <p className="text-sm text-muted-foreground">
                              {"Principal" in fullCapsuleData.subject
                                ? `Principal: ${fullCapsuleData.subject.Principal}`
                                : `Opaque: ${fullCapsuleData.subject.Opaque}`}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Created At</Label>
                            <p className="text-sm text-muted-foreground">
                              {new Date(Number(fullCapsuleData.created_at) / 1000000).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Updated At</Label>
                            <p className="text-sm text-muted-foreground">
                              {new Date(Number(fullCapsuleData.updated_at) / 1000000).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Counts Section */}
                      <div>
                        <h4 className="font-medium mb-3 text-sm">Content Counts</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Memories</Label>
                            <p className="text-sm text-muted-foreground">{fullCapsuleData.memories?.length || 0}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Galleries</Label>
                            <p className="text-sm text-muted-foreground">{fullCapsuleData.galleries?.length || 0}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Connections</Label>
                            <p className="text-sm text-muted-foreground">{fullCapsuleData.connections?.length || 0}</p>
                          </div>
                        </div>
                      </div>

                      {/* Raw Data Section */}
                      <div>
                        <h4 className="font-medium mb-3 text-sm">Raw Data</h4>
                        <pre className="p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-64">
                          {JSON.stringify(fullCapsuleData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-800 dark:border-gray-700 dark:border-t-gray-200 mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading full capsule data...</p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">
                {isAuthenticated
                  ? "No capsule found. You may need to register first."
                  : "Please sign in to view your capsule information."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Capsules List and Creation Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Capsules Management</span>
            {isAuthenticated && (
              <Button
                onClick={handleFetchCapsulesList}
                disabled={busy || isLoadingCapsules}
                variant="outline"
                size="sm"
              >
                {isLoadingCapsules ? "Loading..." : "📋 Refresh List"}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Create New Capsule */}
            <div>
              <h4 className="font-medium mb-3 text-sm">Create New Capsule</h4>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="newCapsuleSubject" className="text-sm">
                    Subject Principal (optional)
                  </Label>
                  <Input
                    id="newCapsuleSubject"
                    value={newCapsuleSubject}
                    onChange={(e) => setNewCapsuleSubject(e.target.value)}
                    placeholder="Leave empty for self-capsule"
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleCreateCapsule} disabled={busy || !isAuthenticated} size="sm">
                  🆕 Create Capsule
                </Button>
              </div>
            </div>

            {/* Capsules List */}
            <div>
              <h4 className="font-medium mb-3 text-sm">Your Capsules</h4>
              {capsulesList.length > 0 ? (
                <div className="space-y-3">
                  {capsulesList.map((capsule, index) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-xs font-medium">Capsule ID</Label>
                          <p className="font-mono text-xs">{capsule.id}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Subject</Label>
                          <p className="text-xs">
                            {"Principal" in capsule.subject
                              ? `Principal: ${capsule.subject.Principal}`
                              : `Opaque: ${capsule.subject.Opaque}`}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Owner Count</Label>
                          <p className="text-xs">{capsule.owner_count}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Memory Count</Label>
                          <p className="text-xs">{capsule.memory_count}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">
                    {isAuthenticated
                      ? "No capsules found. Create your first capsule above."
                      : "Please sign in to manage capsules."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capsule Read Result Display */}
      {capsuleReadResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Capsule Read Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Capsule ID</Label>
                  <p className="text-sm text-muted-foreground font-mono">{capsuleReadResult.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Subject</Label>
                  <p className="text-sm text-muted-foreground">
                    {"Principal" in capsuleReadResult.subject
                      ? `Principal: ${capsuleReadResult.subject.Principal}`
                      : `Opaque: ${capsuleReadResult.subject.Opaque}`}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created At</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(Number(capsuleReadResult.created_at) / 1000000).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Updated At</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(Number(capsuleReadResult.updated_at) / 1000000).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Memory and Gallery Counts */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Memory Count</Label>
                  <p className="text-sm text-muted-foreground">{capsuleReadResult.memories?.length || 0}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Gallery Count</Label>
                  <p className="text-sm text-muted-foreground">{capsuleReadResult.galleries?.length || 0}</p>
                </div>
              </div>

              {/* Raw Data Display */}
              <div className="mt-4">
                <Label className="text-sm font-medium">Raw Data</Label>
                <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-64">
                  {JSON.stringify(capsuleReadResult, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
