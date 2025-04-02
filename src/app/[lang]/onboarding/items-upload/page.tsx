import { getDictionary } from "@/utils/dictionaries";
import ItemsUploadClient from "./items-upload-client";

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function ItemsUploadPage({ params }: PageProps) {
  // Await the params Promise first
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang, { includeOnboarding: true });

  return <ItemsUploadClient lang={resolvedParams.lang} dict={dict} />;
}

// "use client";

// import { useState } from "react";
// import { useInterface } from "@/contexts/interface-context";
// import { useRouter, useParams } from "next/navigation";
// import { OnboardModal } from "@/components/onboarding/onboard-modal";
// import { MemoryUpload } from "@/components/memory/MemoryUpload";
// import { getDictionary, Dictionary } from "@/utils/dictionaries";

// export default function ItemsUpload() {
//   const params = useParams();
//   const lang = params.lang as string;
//   const router = useRouter();
//   const { setMode } = useInterface();
//   const [showOnboardModal, setShowOnboardModal] = useState(false);

//   const handleUploadSuccess = () => {
//     console.log("📤 File upload success - opening modal");
//     setShowOnboardModal(true);
//   };

//   const handleModalClose = () => {
//     console.log("🚪 Modal closing");
//     setShowOnboardModal(false);
//   };

//   const handleOnboardingComplete = () => {
//     setShowOnboardModal(false);
//     setMode("app");
//     router.push("/onboarding/profile");
//   };

//   const dict = (await getDictionary(lang)) as Dictionary;
//   const copy = dict.onboarding?.["items-upload"]?.variations?.["leave-one-item"];

//   if (!copy) {
//     throw new Error("Missing dictionary entries for items-upload");
//   }

//   return (
//     <div className="w-full max-w-[95%] sm:max-w-[90%] lg:max-w-[85%] mx-auto px-4 py-8 flex flex-col gap-16">
//       {/* Title and subtitle container */}
//       <div className="max-w-4xl">
//         <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-8 tracking-tight">{copy.title}</h1>
//         <p className="text-xl sm:text-2xl text-muted-foreground">{copy.subtitle}</p>
//       </div>

//       {/* Upload button container */}
//       <div className="flex justify-center">
//         <MemoryUpload isOnboarding variant="large-icon" onSuccess={handleUploadSuccess} />
//       </div>

//       {/* Onboarding Modal */}
//       <OnboardModal isOpen={showOnboardModal} onClose={handleModalClose} onComplete={handleOnboardingComplete} />
//     </div>
//   );
// }
