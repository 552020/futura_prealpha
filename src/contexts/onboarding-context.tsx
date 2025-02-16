"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface TempFile {
  url: string;
  file: File;
  uploadedAt: Date;
}

interface OnboardingContextType {
  files: TempFile[];
  addFile: (file: TempFile) => void;
  removeFile: (url: string) => void;
  clearFiles: () => void;
  currentStep: "upload" | "profile" | "complete";
  setCurrentStep: (step: "upload" | "profile" | "complete") => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<TempFile[]>([]);
  const [currentStep, setCurrentStep] = useState<"upload" | "profile" | "complete">("upload");

  // Add a new file
  const addFile = (file: TempFile) => {
    setFiles((prev) => [...prev, file]);
  };

  // Remove a file by URL
  const removeFile = (url: string) => {
    setFiles((prev) => {
      const newFiles = prev.filter((f) => f.url !== url);
      // Cleanup URL
      URL.revokeObjectURL(url);
      return newFiles;
    });
  };

  // Clear all files
  const clearFiles = () => {
    files.forEach((f) => URL.revokeObjectURL(f.url));
    setFiles([]);
  };

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.url));
    };
  }, [files]);

  return (
    <OnboardingContext.Provider
      value={{
        files,
        addFile,
        removeFile,
        clearFiles,
        currentStep,
        setCurrentStep,
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
