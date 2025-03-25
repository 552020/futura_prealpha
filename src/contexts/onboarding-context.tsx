"use client";

import { createContext, useContext, useState } from "react";

interface TempFile {
  url: string;
  file: File;
  uploadedAt: Date;
  memoryId?: string;
  fileType?: string; // MIME type of the file
}

export type OnboardingStep = "upload" | "user-info" | "share" | "sign-up" | "complete";

interface OnboardingContextType {
  files: TempFile[];
  addFile: (file: TempFile) => void;
  removeFile: (url: string) => void;
  clearFiles: () => void;
  currentStep: OnboardingStep;
  setCurrentStep: (step: OnboardingStep) => void;
  userData: {
    name: string;
    email: string;
    recipientName: string;
    recipientEmail: string;
    relationship: string;
    familyRelationship: string;
    allUserId?: string; // ID from the allUsers table
    isTemporary: boolean; // Whether the current user is temporary
  };
  updateUserData: (data: Partial<OnboardingContextType["userData"]>) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<TempFile[]>([]);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("upload");
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    recipientName: "",
    recipientEmail: "",
    relationship: "",
    familyRelationship: "",
    isTemporary: true, // Default to true since most onboarding users start as temporary
    allUserId: undefined as string | undefined,
  });

  // Update user data - using functional update pattern
  const updateUserData = (update: Partial<typeof userData> | ((prev: typeof userData) => Partial<typeof userData>)) => {
    console.log("Updating userData:", typeof update === "function" ? "function" : update);
    setUserData((prev) => ({
      ...prev,
      ...(typeof update === "function" ? update(prev) : update),
    }));
  };

  // Add a file
  const addFile = (file: TempFile) => {
    setFiles((prev) => [...prev, file]);
  };

  // Remove a file by URL
  const removeFile = (url: string) => {
    // Revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(url);
    setFiles((prev) => prev.filter((f) => f.url !== url));
  };

  // Clear all files
  const clearFiles = () => {
    // Revoke all object URLs
    files.forEach((file) => URL.revokeObjectURL(file.url));
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
