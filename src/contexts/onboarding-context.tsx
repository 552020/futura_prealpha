"use client";

import { createContext, useContext, useState } from "react";

interface TempFile {
  url: string;
  file: File;
  uploadedAt: Date;
}

// TODO: Convert relationship and familyRelationship to proper enums for type safety
// Example:
// enum Relationship {
//   Family = "family",
//   Friend = "friend",
//   Partner = "partner",
//   Colleague = "colleague",
//   Acquaintance = "acquaintance",
//   Other = "other"
// }
//
// enum FamilyRelationship {
//   Parent = "parent",
//   Child = "child",
//   Sibling = "sibling",
//   Grandparent = "grandparent",
//   Grandchild = "grandchild",
//   AuntUncle = "aunt-uncle",
//   NieceNephew = "niece-nephew",
//   Cousin = "cousin",
//   OtherFamily = "other-family"
// }

//
// // Then create a more sophisticated type that binds FamilyRelationship to Relationship.Family:
// type RelationshipData =
//   | { type: Relationship.Family; familyRelationship: FamilyRelationship }
//   | { type: Exclude<Relationship, Relationship.Family>; familyRelationship?: never }
//
// // This would ensure that familyRelationship is required when type is Family,
// // and not allowed for other relationship types

// Improved step type with better semantic naming
type OnboardingStep =
  | "upload" // Initial upload page
  | "user-info" // Modal: Collecting user's name (after successful upload)
  | "share" // Modal: Sharing options
  | "sign-up" // Modal: Authentication (renamed from sign-in)
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
    familyRelationship: string;
  };
  updateUserData: (data: Partial<OnboardingContextType["userData"]>) => void;
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
    familyRelationship: "",
  });

  // Update user data - using functional update pattern
  const updateUserData = (update: Partial<typeof userData> | ((prev: typeof userData) => Partial<typeof userData>)) => {
    console.log("Updating userData:", typeof update === "function" ? "function" : update);
    setUserData((prev) => ({
      ...prev,
      ...(typeof update === "function" ? update(prev) : update),
    }));
  };

  //   const updateUserData = (newUserData: Partial<typeof userData>) => {
  //     setUserData((prev) => ({ ...prev, ...newUserData }));
  //   };

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

  //   // Use useMemo to prevent unnecessary re-renders
  //   const contextValue = useMemo(
  //     () => ({
  //       files,
  //       addFile,
  //       removeFile,
  //       clearFiles,
  //       currentStep,
  //       setCurrentStep,
  //       userData,
  //       updateUserData,
  //     }),
  //     [files, currentStep, userData]
  //   ); // Only re-create when these values change

  //   return <OnboardingContext.Provider value={contextValue}>{children}</OnboardingContext.Provider>;
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
