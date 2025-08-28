"use client";

import { useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// ICP imports moved to dynamic imports inside functions

// Prevent static generation of this page
export const dynamic = "force-dynamic";

function SignInPageInternal() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = (params?.lang as string) || "en";
  const callbackUrl = searchParams.get("callbackUrl") || `/${lang}/dashboard`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iiBusy, setIiBusy] = useState(false);

  async function handleCredentialsSignIn(e: React.FormEvent) {
    console.log("handleCredentialsSignIn", email, password);
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError("Invalid email or password");
        return;
      }
      console.log("handleCredentialsSignIn", res);

      // Navigate after successful credentials sign-in
      router.push(callbackUrl);
    } catch {
      setError("Sign in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleProvider(provider: "github" | "google") {
    if (busy) return;
    setBusy(true);
    // Provider flows use NextAuth redirects; NextAuth redirect callback will land on /{lang}/dashboard
    // but we pass callbackUrl to be explicit.
    void signIn(provider, { callbackUrl }).finally(() => setBusy(false));
  }

  async function handleInternetIdentity() {
    console.log("handleInternetIdentity", iiBusy, busy);
    if (iiBusy || busy) return;
    setError(null);
    setIiBusy(true);
    try {
      // 4.1: Ensure II identity with AuthClient.login ✅ DONE
      console.log("handleInternetIdentity", "before loginWithII");
      const { loginWithII } = await import("@/ic/ii");
      const { principal, identity } = await loginWithII();
      console.log("handleInternetIdentity", "after loginWithII", principal);

      // 4.2: Fetch challenge → get { nonceId, nonce } ✅ DONE
      console.log("handleInternetIdentity", "before fetchChallenge");
      const { fetchChallenge } = await import("@/lib/ii-client");
      const challenge = await fetchChallenge(callbackUrl);
      console.log("handleInternetIdentity", "after fetchChallenge", challenge);

      // 4.3-4.4: Register user and prove nonce in one call ✅ DONE
      console.log("handleInternetIdentity", "before registerWithNonce");
      const { registerWithNonce } = await import("@/lib/ii-client");
      const registration = await registerWithNonce(challenge.nonce, identity);
      console.log("handleInternetIdentity", "after registerWithNonce", registration);

      // 4.5: Call signIn with principal + nonceId (no signature needed)
      console.log("handleInternetIdentity", "before signIn", principal, challenge.nonceId);
      const signInResult = await signIn("ii", { principal, nonceId: challenge.nonceId, redirect: false, callbackUrl });
      console.log("handleInternetIdentity", "after signIn", signInResult);

      // 5.6: (Optional) After success, call mark_bound() on canister
      if (signInResult?.ok) {
        console.log("handleInternetIdentity", "before markBoundOnCanister");
        try {
          const { markBoundOnCanister } = await import("@/lib/ii-client");
          await markBoundOnCanister(identity);
          console.log("handleInternetIdentity", "after markBoundOnCanister - success");
        } catch (error) {
          console.warn("handleInternetIdentity", "markBoundOnCanister failed", error);
          // Don't fail the auth flow if this optional step fails
        }

        // Redirect manually after successful authentication
        router.push(callbackUrl);
      } else {
        console.error("handleInternetIdentity", "signIn failed", signInResult?.error);

        // Provide user-friendly error messages
        let errorMessage = "Authentication failed. Please try again.";

        if (signInResult?.error) {
          if (signInResult.error.includes("challenge expired")) {
            errorMessage = "Authentication session expired. Please try signing in again.";
          } else if (signInResult.error.includes("challenge already used")) {
            errorMessage = "Authentication session already used. Please try signing in again.";
          } else if (signInResult.error.includes("proof not found")) {
            errorMessage = "Authentication verification failed. Please try signing in again.";
          } else if (signInResult.error.includes("proof mismatch")) {
            errorMessage = "Authentication verification failed. Please try signing in again.";
          } else if (signInResult.error.includes("Unable to verify")) {
            errorMessage = "Authentication verification failed. Please try signing in again.";
          } else if (signInResult.error.includes("Unable to create user")) {
            errorMessage = "Unable to create account. Please try signing in again.";
          }
        }

        setError(errorMessage);
      }

      // Current implementation (needs updating)
      console.log("handleInternetIdentity", "before signIn", principal, callbackUrl);
      await signIn("ii", { principal, redirect: true, callbackUrl });
      console.log("handleInternetIdentity", "after signIn");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Internet Identity sign-in failed: ${msg}`);
    } finally {
      setIiBusy(false);
    }
  }

  function close() {
    // Prefer going back; if no history, go home for lang
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(`/${lang}`);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-slate-950 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Sign in</h1>
          <Button variant="ghost" size="sm" onClick={close}>
            Close
          </Button>
        </div>

        <div className="grid gap-3">
          <Button variant="outline" onClick={() => handleProvider("google")} disabled={busy || iiBusy}>
            Sign in with Google
          </Button>
          <Button variant="outline" onClick={handleInternetIdentity} disabled={iiBusy || busy}>
            {iiBusy ? "Connecting to Internet Identity…" : "Sign in with Internet Identity"}
          </Button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleCredentialsSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in..." : "Sign in with Email"}
          </Button>
        </form>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          <Link
            href={`/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="underline underline-offset-2 hover:text-foreground"
          >
            Use default sign-in page
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignInPageInternal />
    </Suspense>
  );
}
