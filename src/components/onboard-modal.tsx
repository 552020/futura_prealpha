"use client";

import { useEffect, useRef, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOnboarding } from "@/contexts/onboarding-context";
import { Share2 } from "lucide-react";

// Define cleanup strategy type
type CleanupStrategy = "none" | "last" | "all";

interface OnboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  cleanupOnClose?: CleanupStrategy;
  showUploadedImage?: boolean;
}

export function OnboardModal({
  isOpen,
  onClose,
  onComplete,
  cleanupOnClose = "all",
  showUploadedImage = false,
}: OnboardModalProps) {
  console.log("OnboardModal rendering", {
    isOpen,
  });

  const { files, currentStep, setCurrentStep, userData, updateUserData, removeFile, clearFiles } = useOnboarding();

  // After the localName state is defined (line 47)
  const [localName, setLocalName] = useState(userData.name);
  const [localRecipientName, setLocalRecipientName] = useState(userData.recipientName);
  const [localRecipientEmail, setLocalRecipientEmail] = useState(userData.recipientEmail);
  const [lastFocusedField, setLastFocusedField] = useState<string | null>(null);
  console.log("After localName initialization:", { localName, userData_name: userData.name });

  // Add refs to maintain focus
  const nameInputRef = useRef<HTMLInputElement>(null);
  const recipientNameRef = useRef<HTMLInputElement>(null);
  const recipientEmailRef = useRef<HTMLInputElement>(null);

  // Sync local state with context when userData changes
  useEffect(() => {
    console.log("Sync effect triggered", {
      currentStep,
      userData_name: userData.name,
      localName,
    });

    if (currentStep === "user-info") {
      console.log("Updating localName from userData");
      setLocalName(userData.name);
    }
  }, [currentStep, userData.name]);

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
    // Update the context with local state before proceeding
    if (currentStep === "user-info") {
      updateUserData({ name: localName });
    }

    switch (currentStep) {
      case "user-info":
        // Only proceed if name is provided
        if (localName.trim()) {
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

  // Update form data - using local state for name input
  const handleEventBasedNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalName(e.target.value);
    updateUserData({ name: newValue });
    console.log("handleEventBasedNameChange called", {
      newValue,
      oldValue: localName,
      activeElement: document.activeElement?.id || "none",
    });
  };

  // Original handleChange for all other inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateUserData({ [name]: value });
  };

  // In the handleUncontrolledNameChange function
  // Triggered by the input field when it loses focus
  const handleRefBasedNameChange = () => {
    console.log("handleRefBasedNameChange called", {
      inputValue: nameInputRef.current?.value,
      currentLocalName: localName,
      userData_name: userData.name,
    });

    if (nameInputRef.current) {
      const newValue = nameInputRef.current.value;
      setLocalName(newValue);
      updateUserData({ name: newValue });
      console.log("setLocalName called with:", newValue);
    }
  };

  const handleRefBasedRecipientChange = () => {
    console.log("handleRefBasedRecipientChange called", {
      activeElement: document.activeElement,

      activeElementId: document.activeElement?.id || "none",
      activeElementTagName: document.activeElement?.tagName || "none",
      recipientNameRefId: recipientNameRef.current?.id || "none",
      recipientEmailRefId: recipientEmailRef.current?.id || "none",
      isNameRefActive: document.activeElement === recipientNameRef.current,
      isEmailRefActive: document.activeElement === recipientEmailRef.current,
      nameRefValue: recipientNameRef.current?.value || "",
      emailRefValue: recipientEmailRef.current?.value || "",
    });
    if (document.activeElement === recipientNameRef.current && recipientNameRef.current) {
      const newValue = recipientNameRef.current.value;
      console.log("About to update recipientName with:", newValue);

      setLocalRecipientName(newValue);
      updateUserData({ recipientName: newValue });
      console.log("setLocalRecipientName called with:", newValue);
    } else if (document.activeElement === recipientEmailRef.current && recipientEmailRef.current) {
      const newValue = recipientEmailRef.current.value;
      console.log("About to update recipientEmail with:", newValue);
      setLocalRecipientEmail(newValue);
      updateUserData({ recipientEmail: newValue });
      console.log("setLocalRecipientEmail called with:", newValue);
    }
  };

  useEffect(() => {
    console.log("Focus effect triggered", {
      currentStep,
      hasInputRef: nameInputRef.current ? true : false,
      localName,
    });

    if (currentStep === "user-info" && nameInputRef.current) {
      nameInputRef.current.focus();
      console.log("Input focused");
    }
  }, [currentStep, localName]);

  // Add this useEffect to maintain focus for recipient fields
  useEffect(() => {
    console.log("Recipient focus effect triggered", {
      currentStep,
      hasNameRef: recipientNameRef.current ? true : false,
      hasEmailRef: recipientEmailRef.current ? true : false,
      localRecipientName,
      localRecipientEmail,
      activeElement: document.activeElement?.id || "none",
    });

    // If we're on the share step
    //     if (currentStep === "share") {
    //       // Check which field had focus before the update
    //       const activeElementId = document.activeElement?.id;

    //       if (activeElementId === "recipientName" && recipientNameRef.current) {
    //         recipientNameRef.current.focus();
    //         console.log("Recipient name input focused");
    //       } else if (activeElementId === "recipientEmail" && recipientEmailRef.current) {
    //         recipientEmailRef.current.focus();
    //         console.log("Recipient email input focused");
    //       }
    //     }
    //   }, [currentStep, localRecipientName, localRecipientEmail]);
    if (currentStep === "share" && lastFocusedField) {
      if (lastFocusedField === "recipientName" && recipientNameRef.current) {
        recipientNameRef.current.focus();
      } else if (lastFocusedField === "recipientEmail" && recipientEmailRef.current) {
        recipientEmailRef.current.focus();
      }
    }
  }, [currentStep, localRecipientName, localRecipientEmail, lastFocusedField]);

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
            value={localName}
            onChange={handleEventBasedNameChange}
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

  const UserInfoWithoutImageStep = () => {
    console.log("UserInfoWithoutImageStep rendering", {
      nameInputRef_current: nameInputRef.current ? "exists" : "null",
      userData_name: userData.name,
      localName,
    });

    // In the useEffect that syncs ref with userData.name
    useEffect(() => {
      console.log("UserInfoWithoutImageStep useEffect triggered", {
        userData_name: userData.name,
        inputValue: nameInputRef.current?.value || "empty",
        localName,
      });

      if (nameInputRef.current && userData.name && !nameInputRef.current.value) {
        console.log("Updating input value to match userData.name");
        nameInputRef.current.value = userData.name;
      }
    }, [userData.name]);

    console.log("UserInfoWithoutImageStep before return", {
      defaultValue: userData.name,
    });

    return (
      <div className="space-y-6">
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">How should we call you?</Label>
            <Input
              ref={nameInputRef}
              id="name"
              name="name"
              defaultValue={userData.name}
              //   onChange={handleRefBasedNameChange}
              onChange={handleEventBasedNameChange}
              onFocus={() => console.log("Input focused")}
              onBlur={() => console.log("Input blurred")}
              placeholder="Enter your name"
            />
          </div>

          <div className="pt-4">
            <p className="text-sm">Let's share this memory with someone special</p>
          </div>
        </div>
      </div>
    );
  };

  const ShareStep = () => (
    <div className="space-y-4 py-4">
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">
          Hi {userData.name}! Let's share this special memory with someone you care about.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recipientName">Their Name</Label>
        <Input
          ref={recipientNameRef}
          id="recipientName"
          name="recipientName"
          value={userData.recipientName}
          onChange={handleRefBasedRecipientChange}
          onFocus={() => {
            console.log(" Recipient Name input focused");
            setLastFocusedField("recipientName");
          }}
          //   onFocus={() => console.log("Input focused")}
          onBlur={() => console.log("Input blurred")}
          placeholder="Enter their name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="recipientEmail">Their Email</Label>
        <Input
          ref={recipientEmailRef}
          id="recipientEmail"
          name="recipientEmail"
          value={userData.recipientEmail}
          onChange={handleRefBasedRecipientChange}
          onFocus={() => {
            console.log(" Recipient Email input focused");
            setLastFocusedField("recipientEmail");
          }}
          //   onFocus={() => console.log("Input focused")}
          onBlur={() => console.log("Input blurred")}
          placeholder="Enter their email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="relationship">Your Relationship</Label>
        <Select value={userData.relationship} onValueChange={(value) => updateUserData({ relationship: value })}>
          <SelectTrigger id="relationship">
            <SelectValue placeholder="How do you know this person?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="family">Family</SelectItem>
            <SelectItem value="friend">Friend</SelectItem>
            <SelectItem value="partner">Partner</SelectItem>
            <SelectItem value="colleague">Colleague</SelectItem>
            <SelectItem value="acquaintance">Acquaintance</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const SignInStep = () => (
    <div className="space-y-4 py-4">
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">
          {userData.name}, create an account to save and manage your memories.
        </p>
      </div>
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
        return userData.name ? `${userData.name}, share this memory` : "Share this memory";
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
      return !localName.trim();
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
