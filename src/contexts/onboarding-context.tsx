"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface OnboardingContextType {
  tempFile: { url: string; file: File } | null;
  setTempFile: (file: { url: string; file: File } | null) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [tempFile, setTempFile] = useState<{ url: string; file: File } | null>(null);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (tempFile?.url) {
        URL.revokeObjectURL(tempFile.url);
      }
    };
  }, [tempFile]);

  return <OnboardingContext.Provider value={{ tempFile, setTempFile }}>{children}</OnboardingContext.Provider>;
}

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error("useOnboarding must be used within OnboardingProvider");
  return context;
};
