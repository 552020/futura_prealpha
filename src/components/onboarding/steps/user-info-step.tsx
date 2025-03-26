import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboarding } from "@/contexts/onboarding-context";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { StepContainer } from "../common/step-container";
import { StepNavigation } from "../common/step-navigation";

interface UserInfoStepProps {
  withImage?: boolean;
  collectEmail?: boolean;
  onNext: () => void;
  onBack: () => void;
}

export function UserInfoStep({ withImage = false, collectEmail = true, onNext, onBack }: UserInfoStepProps) {
  const {
    userData,
    updateUserData,
    files: [lastUploadedFile],
    currentStep,
  } = useOnboarding();

  // Local state for input values
  const [localName, setLocalName] = useState(userData.name);
  const [localEmail, setLocalEmail] = useState(userData.email);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Sync local state with context when userData changes
  useEffect(() => {
    if (currentStep === "user-info") {
      setLocalName(userData.name);
      setLocalEmail(userData.email);
    }
  }, [currentStep, userData.name, userData.email]);

  // Focus for name field
  useEffect(() => {
    if (currentStep === "user-info" && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [currentStep, localName]);

  // Focus for email field
  useEffect(() => {
    if (currentStep === "user-info" && emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [currentStep, localEmail]);

  const handleEventBasedNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalName(newValue);
    updateUserData({ name: newValue });
  };

  const handleEventBasedEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalEmail(newValue);
    updateUserData({ email: newValue });
  };

  return (
    // <StepContainer title="Tell us about yourself" description="Help us personalize your experience">
    <StepContainer>
      {withImage && lastUploadedFile && (
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
        {!withImage && (
          <div className="pt-4">
            <p className="text-4xl font-bold">Let&apos;s now share this memory with someone special!</p>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="name">How should we call you?</Label>
          <Input
            ref={nameInputRef}
            id="name"
            name="name"
            defaultValue={userData.name}
            onChange={handleEventBasedNameChange}
            placeholder="Enter your name"
          />
        </div>

        {collectEmail && (
          <div className="space-y-2">
            <Label htmlFor="email">Your Email</Label>
            <Input
              ref={emailInputRef}
              id="email"
              name="email"
              type="email"
              defaultValue={userData.email}
              onChange={handleEventBasedEmailChange}
              placeholder="Enter your email"
            />
          </div>
        )}
      </div>
      <StepNavigation currentStep={currentStep} onNext={onNext} onBack={onBack} />
    </StepContainer>
  );
}
