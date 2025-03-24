"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOnboarding } from "@/contexts/onboarding-context";
import { Share2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define cleanup strategy type for when we close the modal
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
  const { toast } = useToast();

  const [localName, setLocalName] = useState(userData.name);
  const [localRecipientName, setLocalRecipientName] = useState(userData.recipientName);
  const [localRecipientEmail, setLocalRecipientEmail] = useState(userData.recipientEmail);
  const [lastFocusedField, setLastFocusedField] = useState<string | null>(null);
  //   console.log("After localName initialization:", { localName, userData_name: userData.name });

  // Add refs to maintain focus while typing
  const nameInputRef = useRef<HTMLInputElement>(null);
  const recipientNameRef = useRef<HTMLInputElement>(null);
  const recipientEmailRef = useRef<HTMLInputElement>(null);

  // Sync local state with context when userData changes
  useEffect(() => {
    if (currentStep === "user-info") {
      setLocalName(userData.name);
    }
  }, [currentStep, userData.name]);

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep("user-info");
    }
  }, [isOpen, setCurrentStep]);

  // Get the most recently uploaded file to display in the modal
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
        setCurrentStep("sign-up");
        break;
      case "sign-up":
        console.log("sign-up step");
        // setCurrentStep("complete");
        // We are handling this already in the handleSuccessfulOnboardingAuth function
        // setCurrentStep("complete");
        // onComplete moved into handleSuccessfulOnboardingAuth
        // onComplete();
        break;
    }
  };

  // Enhanced modal close with configurable cleanup strategies
  const handleModalClose = () => {
    // Reset to first modal step when closing
    setCurrentStep("user-info");

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
          clearFiles();
          break;

        case "none":
        default:
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
    // console.log("handleEventBasedNameChange called", {
    //   newValue,
    //   oldValue: localName,
    //   activeElement: document.activeElement?.id || "none",
    // });
  };

  // In the handleUncontrolledNameChange function
  // Triggered by the input field when it loses focus
  //   const handleRefBasedNameChange = () => {
  //     console.log("handleRefBasedNameChange called", {
  //       inputValue: nameInputRef.current?.value,
  //       currentLocalName: localName,
  //       userData_name: userData.name,
  //     });

  //     if (nameInputRef.current) {
  //       const newValue = nameInputRef.current.value;
  //       setLocalName(newValue);
  //       updateUserData({ name: newValue });
  //       console.log("setLocalName called with:", newValue);
  //     }
  //   };

  const handleRefBasedRecipientChange = () => {
    // console.log("handleRefBasedRecipientChange called", {
    //   activeElement: document.activeElement,

    //   activeElementId: document.activeElement?.id || "none",
    //   activeElementTagName: document.activeElement?.tagName || "none",
    //   recipientNameRefId: recipientNameRef.current?.id || "none",
    //   recipientEmailRefId: recipientEmailRef.current?.id || "none",
    //   isNameRefActive: document.activeElement === recipientNameRef.current,
    //   isEmailRefActive: document.activeElement === recipientEmailRef.current,
    //   nameRefValue: recipientNameRef.current?.value || "",
    //   emailRefValue: recipientEmailRef.current?.value || "",
    // });
    if (document.activeElement === recipientNameRef.current && recipientNameRef.current) {
      const newValue = recipientNameRef.current.value;
      //   console.log("About to update recipientName with:", newValue);

      setLocalRecipientName(newValue);
      updateUserData({ recipientName: newValue });
      //   console.log("setLocalRecipientName called with:", newValue);
    } else if (document.activeElement === recipientEmailRef.current && recipientEmailRef.current) {
      const newValue = recipientEmailRef.current.value;
      //   console.log("About to update recipientEmail with:", newValue);
      setLocalRecipientEmail(newValue);
      updateUserData({ recipientEmail: newValue });
      //   console.log("setLocalRecipientEmail called with:", newValue);
    }
  };

  useEffect(() => {
    if (currentStep === "user-info" && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [currentStep, localName]);

  // Add this useEffect to maintain focus for recipient fields
  useEffect(() => {
    // console.log("Recipient focus effect triggered", {
    //   currentStep,
    //   hasNameRef: recipientNameRef.current ? true : false,
    //   hasEmailRef: recipientEmailRef.current ? true : false,
    //   localRecipientName,
    //   localRecipientEmail,
    //   activeElement: document.activeElement?.id || "none",
    // });

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
    // console.log("UserInfoWithoutImageStep rendering", {
    //   nameInputRef_current: nameInputRef.current ? "exists" : "null",
    //   userData_name: userData.name,
    //   localName,
    // });

    // In the useEffect that syncs ref with userData.name
    useEffect(() => {
      //   console.log("UserInfoWithoutImageStep useEffect triggered", {
      //     userData_name: userData.name,
      //     inputValue: nameInputRef.current?.value || "empty",
      //     localName,
      //   });

      if (nameInputRef.current && userData.name && !nameInputRef.current.value) {
        // console.log("Updating input value to match userData.name");
        nameInputRef.current.value = userData.name;
      }
    }, [userData.name]);

    // console.log("UserInfoWithoutImageStep before return", {
    //   defaultValue: userData.name,
    // });

    return (
      <div className="space-y-6 border-2 border-dotted border-red-500 rounded-md">
        <div className="space-y-4 py-4">
          <div className="pt-4">
            <p className="text-4xl font-bold">Let&apos;s now share this memory with someone special!</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">How should we call you?</Label>
            <Input
              ref={nameInputRef}
              id="name"
              name="name"
              defaultValue={userData.name}
              //   onChange={handleRefBasedNameChange}
              onChange={handleEventBasedNameChange}
              //   onFocus={() => console.log("Input focused")}
              //   onBlur={() => console.log("Input blurred")}
              placeholder="Enter your name"
            />
          </div>
        </div>
      </div>
    );
  };

  const ShareStep = () => {
    // Get the current relationship value to conditionally render the family dropdown
    const relationship = userData.relationship || "";

    return (
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="recipientName">Their Name</Label>
          <Input
            ref={recipientNameRef}
            id="recipientName"
            name="recipientName"
            value={userData.recipientName}
            onChange={handleRefBasedRecipientChange}
            onFocus={() => {
              //   console.log(" Recipient Name input focused");
              setLastFocusedField("recipientName");
            }}
            // onBlur={() => console.log("Input blurred")}
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
              //   console.log(" Recipient Email input focused");
              setLastFocusedField("recipientEmail");
            }}
            // onBlur={() => console.log("Input blurred")}
            placeholder="Enter their email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="relationship">Your Relationship</Label>
          <Select
            value={relationship}
            onValueChange={(value) => {
              // If changing away from family, clear the family relationship
              if (value !== "family" && userData.familyRelationship) {
                updateUserData({
                  relationship: value,
                  familyRelationship: undefined,
                });
              } else {
                updateUserData({ relationship: value });
              }
            }}
          >
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

        {/* Conditional family relationship selector */}
        {relationship === "family" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top duration-300">
            <Label htmlFor="familyRelationship">Family Relationship</Label>
            <Select
              value={userData.familyRelationship || ""}
              onValueChange={(value) => updateUserData({ familyRelationship: value })}
            >
              <SelectTrigger id="familyRelationship">
                <SelectValue placeholder="What is your family relationship?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="sibling">Sibling</SelectItem>
                <SelectItem value="grandparent">Grandparent</SelectItem>
                <SelectItem value="grandchild">Grandchild</SelectItem>
                <SelectItem value="aunt-uncle">Aunt/Uncle</SelectItem>
                <SelectItem value="niece-nephew">Niece/Nephew</SelectItem>
                <SelectItem value="cousin">Cousin</SelectItem>
                <SelectItem value="other-family">Other Family Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    );
  };

  const SignUpStep = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSigningIn, setIsSigningIn] = useState(false); // Track if user is signing in vs signing up

    // This function handles the signup and signin trough credentials (email and password, not social providers handled by handleSocialAuth)
    const handleCredentilsAuthHelper = async (
      email: string,
      password: string,
      isSigningIn: boolean
    ): Promise<boolean> => {
      // Authentication logic
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        console.error(`${isSigningIn ? "Sign in" : "Sign up"} failed:`, result.error);
        toast({
          variant: "destructive",
          title: `${isSigningIn ? "Sign in" : "Sign up"} failed`,
          description: "Please check your credentials and try again.",
        });
        return false;
      }
      await handleSuccessfulOnboardingAuth();
      setCurrentStep("complete");
      return true;
    };

    // This function handles the signup and signin trough credentials (email and password, not social providers handled by handleSocialAuth)
    const handleCredentialAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        if (isSigningIn) {
          await handleCredentilsAuthHelper(email, password, isSigningIn);
        } else {
          if (password !== confirmPassword) {
            toast({
              variant: "destructive",
              title: "Password mismatch",
              description: "Please check your password and try again.",
            });
            setIsLoading(false);
            return;
          }
          await handleCredentilsAuthHelper(email, password, isSigningIn);
        }
      } catch (error) {
        console.error("Authentication failed:", error);
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description: "Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    const handleSuccessfulOnboardingAuth = async () => {
      try {
        console.log("Starting memory upload and sharing process...");

        // 1. Upload the memory
        const formData = new FormData();
        formData.append("file", files[0].file);

        console.log("Uploading memory...", {
          fileName: files[0].file.name,
          fileSize: files[0].file.size,
          fileType: files[0].file.type,
        });

        const responseMemoryUpload = await fetch("/api/memories/upload", {
          method: "POST",
          body: formData,
        });

        if (!responseMemoryUpload.ok) {
          console.error("Memory upload failed:", {
            status: responseMemoryUpload.status,
            statusText: responseMemoryUpload.statusText,
          });
          throw new Error("Failed to upload memory");
        }

        const memoryUploadResult = await responseMemoryUpload.json();
        console.log("Memory upload successful:", memoryUploadResult);

        // Extract memory ID from the response
        const memoryId = memoryUploadResult.data.id;

        // 2. Share the memory
        const shareRequest = {
          target: {
            type: "user",
          },
          method: {
            type: "email",
            email: userData.recipientEmail,
            name: userData.recipientName,
          },
          relationship: {
            type: userData.relationship,
            familyRole: userData.relationship === "family" ? userData.familyRelationship : undefined,
          },
        };

        console.log("Sharing memory...", {
          memoryId,
          shareRequest,
        });

        const responseMemoryShare = await fetch(`/api/memories/${memoryId}/share`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(shareRequest),
        });

        if (!responseMemoryShare.ok) {
          console.error("Memory share failed:", {
            status: responseMemoryShare.status,
            statusText: responseMemoryShare.statusText,
          });
          throw new Error("Failed to share memory");
        }

        const shareResult = await responseMemoryShare.json();
        console.log("Memory share successful:", shareResult);

        // 3. Complete onboarding
        console.log("Completing onboarding process...");
        setCurrentStep("complete");
        onComplete();

        // 4. Redirect to profile page
        // Handled by onComplete prop
        // console.log("Redirecting to profile page...");
        // router.push("/profile");
      } catch (error) {
        console.error("Error in handleSuccessfulOnboardingAuth:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save your memory. Please try again.",
        });
      }
    };

    const handleSocialAuth = async (provider: "google" | "github") => {
      setIsLoading(true);
      try {
        // const result = await signIn(provider, { callbackUrl: "/onboarding/profile", redirect: true });
        const result = await signIn(provider, { redirect: false });
        if (result?.error) {
          toast({
            variant: "destructive",
            title: "Authentication failed",
            description: result.error,
          });
        } else {
          // Auth successful! Now save the memory and share
          await handleSuccessfulOnboardingAuth();
          setCurrentStep("complete");
        }
      } catch (error) {
        console.error("Social authentication error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Toggle between sign up and sign in modes
    const toggleSingInSignInMode = () => {
      setIsSigningIn(!isSigningIn);
      // Reset form fields
      setPassword("");
      setConfirmPassword("");
    };

    // const handleSignInWithEmail = () => {
    //   setShowEmailFields(true);
    // };

    // const handleEmailSignIn = async (e: React.FormEvent) => {
    //   e.preventDefault();
    //   setIsLoading(true);

    //   try {
    //     const result = await signIn("email", {
    //       email,
    //       password,
    //       redirect: false, // Don't redirect automatically
    //     });

    //     if (result?.error) {
    //       console.error("Sign in failed:", result.error);
    //     } else {
    //       setCurrentStep("complete");
    //     }
    //   } catch (error) {
    //     console.error("Sign in failed:", error);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };

    // const handleSocialSignIn = (provider: "google" | "github") => {
    //   // For social providers, we typically don't need to handle the result
    //   // as next-auth will handle the redirect flow
    //   signIn(provider);
    // };

    return (
      <div className="space-y-6 py-4">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium">{isSigningIn ? "Welcome back!" : "Create your account"}</h3>
          <p className="text-sm text-muted-foreground">
            {userData.name}, {isSigningIn ? "sign in" : "create an account"} to save and manage your memories.
          </p>
        </div>

        <div className="space-y-4">
          {/* Social Sign-in Buttons */}
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => {
              handleSocialAuth("google");
            }}
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {isSigningIn ? "Sign in with Google" : "Sign up with Google"}
          </Button>

          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => {
              console.log("GitHub button clicked");
              handleSocialAuth("github");
            }}
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            {isSigningIn ? "Sign in with GitHub" : "Sign up with GitHub"}
          </Button>

          {/* <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div> */}
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleCredentialAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {/* Only show confirm password for sign up */}
          {!isSigningIn && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSigningIn ? "Signing in..." : "Signing up..."}
              </>
            ) : isSigningIn ? (
              "Sign in"
            ) : (
              "Sign up"
            )}
          </Button>
        </form>
        {/* Toggle between sign up and sign in */}
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            {isSigningIn ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline font-medium"
                  onClick={toggleSingInSignInMode}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline font-medium"
                  onClick={toggleSingInSignInMode}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    );
  };

  // Render content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case "user-info":
        return showUploadedImage ? <UserInfoWithImageStep /> : <UserInfoWithoutImageStep />;
      case "share":
        return <ShareStep />;
      case "sign-up":
        return <SignUpStep />;
      default:
        return null;
    }
  };

  // Get step title
  const getStepTitle = () => {
    switch (currentStep) {
      case "user-info":
        return "Memory successfully uploaded! 🥳";
      case "share":
        // return userData.name ? `${userData.name}, share this memory` : "Share this memory";
        return "With whom would you like to share this memory?";
      case "sign-up":
        return "Create your account";
      default:
        return "";
    }
  };

  // Only show modal for steps that should be in the modal
  const modalSteps = ["user-info", "share", "sign-up"];
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
          <DialogTitle className="text-center text-2xl border-2 border-dotted border-black rounded-md mt-6">
            {getStepTitle()}
          </DialogTitle>
        </DialogHeader>

        {/* Dynamic step content */}
        {renderStepContent()}

        {/* Only show footer with Continue button for non-signup steps */}
        {currentStep !== "sign-up" && (
          <DialogFooter className="flex sm:justify-end">
            <Button onClick={handleNext} className="w-full sm:w-auto" disabled={isContinueDisabled()}>
              Continue
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
