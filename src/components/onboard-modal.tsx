"use client";

import { useEffect } from "react";
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

interface OnboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardModal({ isOpen, onClose, onComplete }: OnboardModalProps) {
  const { files, currentStep, setCurrentStep, userData, updateUserData } = useOnboarding();

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
        setCurrentStep("share");
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

  // Handle modal close with cleanup
  const handleModalClose = () => {
    onClose();
  };

  // Update form data
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateUserData({ [name]: value });
  };

  // Render content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case "user-info":
        return (
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
              <p className="text-center pb-2">Let's personalize your experience</p>
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input
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

      case "share":
        return (
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

      case "sign-in":
        return (
          <div className="space-y-4 py-4">
            <p>Sign in options would go here</p>
          </div>
        );
    }
  };

  // Get step title
  const getStepTitle = () => {
    switch (currentStep) {
      case "user-info":
        return "Your memory has been successfully uploaded";
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

  return (
    <Dialog open={showModal} onOpenChange={(open) => !open && handleModalClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">{getStepTitle()}</DialogTitle>
          <DialogDescription className="text-center">
            {currentStep === "user-info" && "Now let's make it personal"}
          </DialogDescription>
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
          <Button onClick={handleNext} className="w-full sm:w-auto">
            {currentStep === "user-info" ? (userData.name ? "Continue" : "Next") : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
