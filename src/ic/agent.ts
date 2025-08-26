"use client";

import { HttpAgent } from "@dfinity/agent";

let cached: Promise<HttpAgent> | null = null;

export function createAgent(): Promise<HttpAgent> {
  if (!cached) {
    const host =
      process.env.NEXT_PUBLIC_IC_HOST ??
      (process.env.NEXT_PUBLIC_DFX_NETWORK === "ic" ? "https://icp-api.io" : "http://127.0.0.1:4943");

    cached = HttpAgent.create({
      host,
      shouldFetchRootKey: process.env.NEXT_PUBLIC_DFX_NETWORK !== "ic",
    });
  }
  return cached;
}

/* ORIGINAL CODE form declarations/backend/index.js*/

// "use client";

// import { HttpAgent } from "@dfinity/agent";

// export function createAgent() {
//   const host =
//     process.env.NEXT_PUBLIC_IC_HOST ??
//     (process.env.NEXT_PUBLIC_DFX_NETWORK === "ic" ? "https://icp-api.io" : "http://127.0.0.1:4943");

//   const agent = new HttpAgent({ host });

//   if (process.env.NEXT_PUBLIC_DFX_NETWORK !== "ic") {
//     // only for local replica
//     agent.fetchRootKey().catch((err) => {
//       console.warn("fetchRootKey failed; is local replica running?");
//       console.error(err);
//     });
//   }

//   return agent;
// }

/* NEWER SOLUTION less optimized */

// "use client";

// import { HttpAgent } from "@dfinity/agent";

// export async function createAgent() {
//   const host =
//     process.env.NEXT_PUBLIC_IC_HOST ??
//     (process.env.NEXT_PUBLIC_DFX_NETWORK === "ic" ? "https://icp-api.io" : "http://127.0.0.1:4943");

//   const agent = await HttpAgent.create({ host });

//   if (process.env.NEXT_PUBLIC_DFX_NETWORK !== "ic") {
//     // only for local replica
//     agent.fetchRootKey().catch((err) => {
//       console.warn("fetchRootKey failed; is local replica running?");
//       console.error(err);
//     });
//   }

//   return agent;
// }
