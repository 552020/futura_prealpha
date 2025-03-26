import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useOnboarding } from "@/contexts/onboarding-context";
import { useToast } from "@/hooks/use-toast";
import { UserInfoStep } from "./steps/user-info-step";
import { ShareStep } from "./steps/share-step";
import { SignUpStep } from "./steps/sign-up-step";

interface OnboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardModal({ isOpen, onClose }: OnboardModalProps) {
  const { currentStep, setCurrentStep, userData, setOnboardingStatus, files } = useOnboarding();
  const { toast } = useToast();

  // Only show modal for steps that should be in the modal
  const modalSteps = ["user-info", "share", "sign-up"];
  const showModal = isOpen && modalSteps.includes(currentStep);
  console.log("🔍 Modal props:", { isOpen, currentStep, showModal, isValidStep: modalSteps.includes(currentStep) });

  // Handle next step
  const handleNext = async () => {
    switch (currentStep) {
      case "upload":
        setOnboardingStatus("in_progress");
        setCurrentStep("user-info");
        break;

      case "user-info":
        try {
          if (!userData.allUserId) {
            throw new Error("User ID not found");
          }

          const response = await fetch(`/api/users/${userData.allUserId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: userData.name,
              email: userData.email,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to update user information");
          }

          setCurrentStep("share");
        } catch (error) {
          console.error("Error updating user information:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to update your information. Please try again.",
          });
        }
        break;

      case "share":
        try {
          // Add debug logs
          console.log("🔍 Files in share step:", {
            filesLength: files.length,
            files: files.map((f) => ({
              url: f.url,
              memoryId: f.memoryId,
              type: f.fileType,
            })),
          });

          // Get the last uploaded file's memoryId
          const lastUploadedFile = files[files.length - 1];
          console.log("📄 Last uploaded file:", {
            exists: !!lastUploadedFile,
            memoryId: lastUploadedFile?.memoryId,
            type: lastUploadedFile?.fileType,
          });

          if (!lastUploadedFile?.memoryId) {
            throw new Error("Memory ID not found");
          }

          // First create a temporary user for the recipient
          const createUserResponse = await fetch("/api/users", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: userData.recipientName,
              email: userData.recipientEmail,
              invitedByAllUserId: userData.allUserId,
              relationship: {
                type: userData.relationship,
                familyRole: userData.relationship === "family" ? userData.familyRelationship : undefined,
                note: "Invited during onboarding",
              },
              metadata: {
                invitedAt: new Date().toISOString(),
                source: "onboarding",
              },
            }),
          });

          if (!createUserResponse.ok) {
            throw new Error("Failed to create recipient user");
          }

          const { allUser: recipientAllUser } = await createUserResponse.json();

          // Now share the memory with the recipient
          const shareResponse = await fetch(`/api/memories/${lastUploadedFile.memoryId}/share`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              target: {
                type: "user",
                allUserId: recipientAllUser.id,
              },
              relationship: {
                type: userData.relationship,
                ...(userData.relationship === "family" && {
                  familyRole: userData.familyRelationship,
                }),
                note: "Invited during onboarding",
              },
              sendEmail: true,
              isInviteeNew: true,
              isOnboarding: true,
              ownerAllUserId: userData.allUserId,
            }),
          });

          if (!shareResponse.ok) {
            const errorData = await shareResponse.json();
            console.error("Share response error:", {
              status: shareResponse.status,
              statusText: shareResponse.statusText,
              errorData,
            });
            throw new Error(errorData.error || errorData.details || "Failed to share memory");
          }

          setCurrentStep("sign-up");
        } catch (error) {
          console.error("Error in share step:", {
            error,
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
          toast({
            variant: "destructive",
            title: "Error",
            description: error instanceof Error ? error.message : "Something went wrong",
          });
        }
        break;

      case "sign-up":
        setOnboardingStatus("completed");
        setCurrentStep("complete");
        break;

      case "complete":
        setOnboardingStatus("completed");
        break;
    }
  };

  const handleBack = () => {
    // Don't change onboarding status when going back
    switch (currentStep) {
      case "user-info":
        setCurrentStep("upload");
        break;
      case "share":
        setCurrentStep("user-info");
        break;
      case "sign-up":
        setCurrentStep("share");
        break;
    }
  };

  return (
    <Dialog open={showModal} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Lorem ipsum</DialogTitle>
          <DialogDescription>Lorem ipsum dolor sit amet</DialogDescription>
        </DialogHeader>
        {currentStep === "user-info" && (
          <UserInfoStep withImage={false} collectEmail={true} onNext={handleNext} onBack={handleBack} />
        )}
        {currentStep === "share" && <ShareStep onNext={handleNext} onBack={handleBack} />}
        {currentStep === "sign-up" && <SignUpStep onBack={handleBack} />}
      </DialogContent>
    </Dialog>
  );
}
