"use client";

import { Profile } from "@/components/profile";
import { Suspense } from "react";

/**
 * Note on Suspense and Component Structure:
 *
 * This page is part of the onboarding flow, specifically showing a user's first uploaded memory.
 * We need to get the file data from URL parameters (passed from the upload page).
 *
 * We use two components because:
 * 1. We need to use useSearchParams() to get URL data
 * 2. useSearchParams is a client-side hook that needs to wait for the page to hydrate
 * 3. Suspense helps us handle this loading state by showing a fallback
 *
 * Without Suspense, we might see errors or flash of content during hydration.
 * The outer component (SuspenseWrappedOnboardingProfilePage) provides the loading boundary,
 * while the inner component (OnboardingProfilePage) handles the actual logic.
 */

function OnboardingProfilePage() {
  return <Profile isOnboarding={true} />;
}

export default function SuspenseWrappedOnboardingProfilePage() {
  return (
    <Suspense fallback={<Profile isOnboarding={true} />}>
      <OnboardingProfilePage />
    </Suspense>
  );
}
