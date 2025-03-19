"use client";

import { createContext, useContext, useState } from "react";

interface TempFile {
  url: string;
  file: File;
  uploadedAt: Date;
}

// Improved step type with better semantic naming
type OnboardingStep =
  | "upload" // Initial upload page
  | "user-info" // Modal: Collecting user's name (after successful upload)
  | "share" // Modal: Sharing options
  | "sign-in" // Modal: Authentication
  | "complete"; // Onboarding complete (profile page)

interface OnboardingContextType {
  files: TempFile[];
  addFile: (file: TempFile) => void;
  removeFile: (url: string) => void;
  clearFiles: () => void;
  currentStep: OnboardingStep;
  setCurrentStep: (step: OnboardingStep) => void;
  userData: {
    name: string;
    recipientName: string;
    recipientEmail: string;
    relationship: string;
  };
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<TempFile[]>([]);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("upload");
  const [userData, setUserData] = useState({
    name: "",
    recipientName: "",
    recipientEmail: "",
    relationship: "",
  });

  const updateUserData = (newUserData: Partial<typeof userData>) => {
    setUserData((prev) => ({ ...prev, ...newUserData }));
  };

  // Add a new file
  const addFile = (file: TempFile) => {
    setFiles((prev) => [...prev, file]);
  };

  // Remove a file by URL
  const removeFile = (url: string) => {
    setFiles((prev) => prev.filter((f) => f.url !== url));
  };

  // Clear all files
  const clearFiles = () => {
    setFiles([]);
  };

  return (
    <OnboardingContext.Provider
      value={{
        files,
        addFile,
        removeFile,
        clearFiles,
        currentStep,
        setCurrentStep,
        userData,
        updateUserData,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error("useOnboarding must be used within OnboardingProvider");
  return context;
};
