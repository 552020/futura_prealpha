"use client";

import { useAuthGuard } from "@/utils/authentication";

import { useState } from "react";
import { backendActor } from "@/ic/backend";
export default function ICPPage() {
  const { isAuthorized, isLoading } = useAuthGuard();
  const [greeting, setGreeting] = useState("");



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
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

      <form onSubmit={handleSubmit} className="mb-6">
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Enter your name:
        </label>
        <div className="flex gap-2">
          <input
            id="name"
            name="name"
            type="text"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your name"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Click Me!
          </button>
        </div>
      </form>

      {greeting && (
        <section className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
          <p className="text-gray-800 dark:text-gray-200">{greeting}</p>
        </section>
      )}
    </div>
  );
}
