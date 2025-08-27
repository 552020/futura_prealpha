"use client";

import { useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginWithII } from "@/ic/ii";

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
      console.log("handleInternetIdentity", "before loginWithII");
      const { principal } = await loginWithII();
      console.log("handleInternetIdentity", "after loginWithII", principal);
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
