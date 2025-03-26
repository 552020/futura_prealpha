import { useCallback } from "react";
import { OnboardingStep, useOnboarding } from "@/contexts/onboarding-context";

const STEP_ORDER: OnboardingStep[] = ["upload", "user-info", "share", "sign-up", "complete"];

export function useStepNavigation() {
  const { currentStep, setCurrentStep } = useOnboarding();

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);

  const canGoBack = currentStepIndex > 0;
  const canGoForward = currentStepIndex < STEP_ORDER.length - 1;

  const goToNextStep = useCallback(() => {
    if (canGoForward) {
      setCurrentStep(STEP_ORDER[currentStepIndex + 1]);
    }
  }, [canGoForward, currentStepIndex, setCurrentStep]);

  const goToPreviousStep = useCallback(() => {
    if (canGoBack) {
      setCurrentStep(STEP_ORDER[currentStepIndex - 1]);
    }
  }, [canGoBack, currentStepIndex, setCurrentStep]);

  const goToStep = useCallback(
    (step: OnboardingStep) => {
      if (STEP_ORDER.includes(step)) {
        setCurrentStep(step);
      }
    },
    [setCurrentStep]
  );

  return {
    currentStep,
    canGoBack,
    canGoForward,
    goToNextStep,
    goToPreviousStep,
    goToStep,
  };
}
