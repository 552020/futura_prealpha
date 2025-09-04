import { backendActor } from "@/ic/backend";
import { Identity } from "@dfinity/agent";

/**
 * Client-side functions for Internet Identity integration
 */

export interface IIChallengeResponse {
  nonceId: string;
  nonce: string;
  ttlSeconds: number;
}

/**
 * Fetch a challenge nonce from the Web2 backend
 */
export async function fetchChallenge(callbackUrl?: string): Promise<IIChallengeResponse> {
  // console.log("DEBUG: fetchChallenge called with callbackUrl:", callbackUrl);
  // console.log("DEBUG: fetchChallenge using fallback:", callbackUrl || "/en/dashboard");

  const response = await fetch("/api/ii/challenge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      callbackUrl: callbackUrl || "/en/dashboard",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch challenge: ${error}`);
  }

  return response.json();
}

/**
 * Register the current user on the backend canister
 * This is step 4.3 in the II integration flow
 */
export async function registerOnCanister(identity: Identity) {
  const actor = await backendActor(identity);
  return actor.register();
}

/**
 * Register user and prove nonce in one call (optimized for II auth flow)
 * This combines steps 4.3 and 4.4 in the II integration flow
 */
export async function registerWithNonce(nonce: string, identity: Identity) {
  try {
    // console.log("DEBUG: registerWithNonce called with nonce length:", nonce.length);
    // console.log("DEBUG: registerWithNonce nonce preview:", nonce.substring(0, 10) + "...");
  } catch (error) {
    console.warn("registerWithNonce error:", error);
  }

  const actor = await backendActor(identity);
  return actor.register_with_nonce(nonce);
}

/**
 * Mark user as bound to Web2 (optional convenience method)
 * This is step 5.6 in the II integration flow
 */
export async function markBoundOnCanister(identity: Identity) {
  const actor = await backendActor(identity);
      // Use the new flexible binding function to bind the caller's capsule to Neon
    return actor.capsules_bind_neon({ Capsule: null }, "", true);
}

/**
 * Prove nonce on the backend canister using authenticated II identity
 * This is step 4.4 in the II integration flow (canister-backed proof)
 */
export async function proveNonceOnCanister(nonce: string, identity: Identity) {
  const actor = await backendActor(identity);
  return actor.prove_nonce(nonce);
}
