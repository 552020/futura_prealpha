"use client";

import { useState } from "react";
import { useInterface } from "@/contexts/interface-context";
import { useRouter } from "next/navigation";
import { OnboardModal } from "@/components/onboarding/onboard-modal";
import { MemoryUpload } from "@/components/memory/MemoryUpload";
import { Dictionary } from "@/utils/dictionaries";

// Hardcoded constants for this component
const COMPONENT_PATH = "items-upload";
const VARIATION = "leave-one-item";

interface ItemsUploadClientProps {
  lang: string;
  dict: Dictionary;
}

export default function ItemsUploadClient({ lang, dict }: ItemsUploadClientProps) {
  const router = useRouter();
  const { setMode } = useInterface();
  const [showOnboardModal, setShowOnboardModal] = useState(false);

  const handleUploadSuccess = () => {
    setShowOnboardModal(true);
  };

  const handleModalClose = () => {
    setShowOnboardModal(false);
  };

  const handleOnboardingComplete = () => {
    setShowOnboardModal(false);
    setMode("app");
    router.push(`/${lang}/onboarding/profile`);
  };

  const copy = dict[COMPONENT_PATH]?.variations?.[VARIATION];

  if (!copy) {
    throw new Error(`Missing dictionary entries for ${COMPONENT_PATH} variation ${VARIATION}`);
  }

  return (
    <div className="w-full max-w-[95%] sm:max-w-[90%] lg:max-w-[85%] mx-auto px-4 py-8 flex flex-col gap-16">
      {/* Title and subtitle container */}
      <div className="max-w-4xl">
        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-8 tracking-tight">{copy.title}</h1>
        <p className="text-xl sm:text-2xl text-muted-foreground">{copy.subtitle}</p>
      </div>

      {/* Upload button container */}
      <div className="flex justify-center">
        <MemoryUpload isOnboarding variant="large-icon" onSuccess={handleUploadSuccess} />
      </div>

      {/* Onboarding Modal */}
      <OnboardModal isOpen={showOnboardModal} onClose={handleModalClose} onComplete={handleOnboardingComplete} />
    </div>
  );
}
