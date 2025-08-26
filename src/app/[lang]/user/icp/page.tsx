"use client";

import { useAuthGuard } from "@/utils/authentication";

import { useState } from "react";
import { backend } from "@/ic/declarations/backend";

export default function ICPPage() {
  const { isAuthorized, isLoading } = useAuthGuard();
  const [greeting, setGreeting] = useState("");

  // Debug: Print environment variables

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;

    backend.greet(name).then((greeting) => {
      setGreeting(greeting);
    });
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
