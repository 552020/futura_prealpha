"use client";

import { useState } from "react";
import { OnboardModal } from "@/components/onboarding/onboard-modal";
import { Dictionary } from "@/utils/dictionaries";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

// Hardcoded constants for this component
const COMPONENT_PATH = "items-upload";
const VARIATION = "leave-one-item";

interface ItemsUploadClientProps {
  lang: string;
  dict: Dictionary;
}

export default function ItemsUploadClient({ dict }: ItemsUploadClientProps) {
  const [showOnboardModal, setShowOnboardModal] = useState(false);

  const handleUploadSuccess = () => {
    setShowOnboardModal(true);
  };

  const handleModalClose = () => {
    setShowOnboardModal(false);
  };

  const copy = dict[COMPONENT_PATH]?.variations?.[VARIATION];

  if (!copy) {
    throw new Error(
      `Missing dictionary entries for ${COMPONENT_PATH} variation ${VARIATION}`
    );
  }

  return (
    <div className="w-full max-w-[95%] sm:max-w-[90%] lg:max-w-[85%] mx-auto px-4 py-8 flex flex-col gap-16">
      {/* Title and subtitle container */}
      <div className="max-w-4xl">
        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-8 tracking-tight">
          {copy.title}
        </h1>
        <p className="text-xl sm:text-2xl text-muted-foreground">
          {copy.subtitle}
        </p>
      </div>

      {/* Upload button container */}
      <div className="flex justify-center">
        <Button
          size="lg"
          className="h-20 w-20 rounded-full"
          onClick={handleUploadSuccess}
        >
          <Upload size={32} />
        </Button>
      </div>

      {/* Onboarding Modal */}
      <OnboardModal isOpen={showOnboardModal} onClose={handleModalClose} />
    </div>
  );
}
