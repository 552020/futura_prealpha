"use client";

/**
 * Custom backend actor implementation to replace the auto-generated backend export.
 *
 * The generated file `declarations/backend/index.js` exports:
 * - `backend` (pre-configured actor instance)
 * - `createActor` (factory function)
 *
 * This file provides a custom `backendActor()` function that replaces both,
 * with better environment handling and caching.
 *
 * Why "backend"? Because when importing the generated file, you typically do:
 * `import { backend } from "@/ic/declarations/backend"` - so this file serves
 * the same purpose as that `backend` export, hence the name.
 */
import { idlFactory as backendIDL } from "@/ic/declarations/backend/backend.did.js";
import { canisterId as BACKEND_CANISTER_ID } from "@/ic/declarations/backend";
import { createAgent } from "./agent";
import { makeActor } from "./actor-factory";
// import type { _SERVICE as Backend } from "@/ic/declarations/backend/backend.did"; // optional typing

export async function backendActor(/* identity? */) {
  const agent = await createAgent();
  return makeActor(/*<Backend>*/ backendIDL, BACKEND_CANISTER_ID, agent);
}

/**
 * Notes on commented code:
 *
 * 1. The comment " identity? " in `backendActor(//* identity? //*)` - Placeholder for future user authentication parameter.
 *    When users need to be authenticated, this would accept an identity object
 *    for signing requests to the canister.
 *
 * 2. The comment "<Backend>" in `backendActor(`//*<Backend>//*``)` - TypeScript generic parameter for type safety.
 *    If uncommented, this would provide better TypeScript intellisense and
 *    type checking for the returned actor methods.
 *    Requires: import type { _SERVICE as Backend } from "@/ic/declarations/backend/backend.did";
 */
