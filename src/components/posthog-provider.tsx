"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_INGEST;

  useEffect(() => {
    console.log("Initializing PostHog with:");
    console.log("  Key:", process.env.NEXT_PUBLIC_POSTHOG_KEY);
    console.log("  Host:", apiHost);

    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      console.warn("❌ No PostHog key found. Skipping init.");
      return;
    }

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: apiHost,
      person_profiles: "identified_only",
      capture_pageview: false,
      capture_pageleave: true,
    });
    console.log("✅ Final PostHog config after init:", posthog.config); // 🔍 Check what this shows
  }, []);

  return (
    <PHProvider client={posthog}>
      <SuspendedPostHogPageView />
      {children}
    </PHProvider>
  );
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      const search = searchParams.toString();
      if (search) {
        url += "?" + search;
      }
      console.log("📡 Capturing pageview:", url);

      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams, posthog]);

  return null;
}

function SuspendedPostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  );
}
