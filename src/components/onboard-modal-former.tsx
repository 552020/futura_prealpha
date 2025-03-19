"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboarding } from "@/contexts/onboarding-context";
import { Share2 } from "lucide-react";

// Define cleanup strategy type
type CleanupStrategyOnModalClose = "none" | "last" | "all";

interface OnboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  cleanupOnClose?: CleanupStrategyOnModalClose;
  showUploadedImage?: boolean;
}

export function OnboardModal({
  isOpen,
  onClose,
  onComplete,
  cleanupOnClose = "all",
  showUploadedImage = false,
}: OnboardModalProps) {
  const { files, currentStep, setCurrentStep, userData, updateUserData, removeFile, clearFiles } = useOnboarding();
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep("user-info");
    }
  }, [isOpen, setCurrentStep]);

  // Get the most recently uploaded file
  const lastUploadedFile = files.length > 0 ? files[files.length - 1] : null;

  // Handle advancing to the next step
  const handleNext = () => {
    switch (currentStep) {
      case "user-info":
        // Only proceed if name is provided
        if (userData.name.trim()) {
          setCurrentStep("share");
        }
        break;
      case "share":
        setCurrentStep("sign-in");
        break;
      case "sign-in":
        setCurrentStep("complete");
        onComplete();
        break;
    }
  };

  // Enhanced modal close with configurable cleanup strategies
  const handleModalClose = () => {
    // Reset to first modal step when closing
    setCurrentStep("user-info");

    // Perform cleanup based on selected strategy
    if (files.length > 0) {
      switch (cleanupOnClose) {
        case "last":
          // Remove only the last uploaded file
          const lastFile = files[files.length - 1];
          if (lastFile) {
            removeFile(lastFile.url);
          }
          break;

        case "all":
          // Clear all files
          clearFiles();
          break;

        case "none":
        default:
          // Do nothing - keep all files
          break;
      }
    }

    onClose();
  };

  // Update form data
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateUserData({ [name]: value });
  };

  // Internal components for each step with variants
  const UserInfoWithImageStep = () => (
    <div className="space-y-6">
      {lastUploadedFile && (
        <div className="relative w-full aspect-square max-w-xs mx-auto overflow-hidden rounded-md">
          <Image
            src={lastUploadedFile.url}
            alt="Uploaded memory"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
            priority
          />
        </div>
      )}

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">How should we call you?</Label>
          <Input
            ref={nameInputRef}
            id="name"
            name="name"
            value={userData.name}
            onChange={handleChange}
            placeholder="Enter your name"
          />
        </div>

        <div className="flex items-center space-x-2 pt-4">
          <Share2 size={18} />
          <p className="text-sm">Would you like to share this memory with someone?</p>
        </div>
      </div>
    </div>
  );

  const UserInfoWithoutImageStep = () => (
    <div className="space-y-6">
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">How should we call you?</Label>
          <Input
            ref={nameInputRef}
            id="name"
            name="name"
            value={userData.name}
            onChange={handleChange}
            placeholder="Enter your name"
          />
        </div>

        <div className="pt-4">
          <p className="text-sm">Let's share this memory with someone special</p>
        </div>
      </div>
    </div>
  );

  const ShareStep = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="recipientName">Recipient's Name</Label>
        <Input
          id="recipientName"
          name="recipientName"
          value={userData.recipientName}
          onChange={handleChange}
          placeholder="Enter recipient's name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="recipientEmail">Recipient's Email</Label>
        <Input
          id="recipientEmail"
          name="recipientEmail"
          value={userData.recipientEmail}
          onChange={handleChange}
          placeholder="Enter recipient's email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="relationship">Your Relationship</Label>
        <Input
          id="relationship"
          name="relationship"
          value={userData.relationship}
          onChange={handleChange}
          placeholder="How do you know this person?"
        />
      </div>
    </div>
  );

  const SignInStep = () => (
    <div className="space-y-4 py-4">
      <p>Sign in options would go here</p>
    </div>
  );

  // Render content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case "user-info":
        return showUploadedImage ? <UserInfoWithImageStep /> : <UserInfoWithoutImageStep />;
      case "share":
        return <ShareStep />;
      case "sign-in":
        return <SignInStep />;
      default:
        return null;
    }
  };

  // Get step title
  const getStepTitle = () => {
    switch (currentStep) {
      case "user-info":
        return "Memory successfully uploaded!";
      case "share":
        return "Share this memory";
      case "sign-in":
        return "Create your account";
      default:
        return "";
    }
  };

  // Only show modal for steps that should be in the modal
  const modalSteps = ["user-info", "share", "sign-in"];
  const showModal = isOpen && modalSteps.includes(currentStep);

  // Check if the continue button should be disabled
  const isContinueDisabled = () => {
    if (currentStep === "user-info") {
      return !userData.name.trim();
    }
    return false;
  };

  return (
    <Dialog open={showModal} onOpenChange={(open) => !open && handleModalClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">{getStepTitle()}</DialogTitle>
          {currentStep === "user-info" && (
            <DialogDescription className="text-center">Let's get started with your memory</DialogDescription>
          )}
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex justify-center space-x-2 py-2">
          {modalSteps.map((step, index) => (
            <div
              key={step}
              className={`h-2 w-2 rounded-full transition-colors ${step === currentStep ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        {/* Dynamic step content */}
        {renderStepContent()}

        <DialogFooter className="flex sm:justify-end">
          <Button onClick={handleNext} className="w-full sm:w-auto" disabled={isContinueDisabled()}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
