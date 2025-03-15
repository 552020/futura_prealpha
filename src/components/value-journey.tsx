"use client";

import Image from "next/image";
import { Dictionary } from "@/app/[lang]/dictionaries/dictionaries";
import { Button } from "./ui/button";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";

type JourneyType = "personal" | "family" | "business";

export default function ValueJourney({
  dict,
  lang,
  journeyType = "personal",
}: {
  dict?: Dictionary;
  lang?: string;
  journeyType?: JourneyType;
}) {
  // Use the passed lang prop if available, otherwise default to "en"
  const currentLang = lang || "en";

  // Get the scenes for the selected journey type
  const getScenes = () => {
    const journeyDict = dict?.valueJourneys?.[journeyType];

    if (!journeyDict) {
      // Fallback to default scenes if the selected journey type is not available
      return [
        {
          image: "/images/story/wedding.jpg",
          title: "Creating Memories",
          description: "Throughout life, we create precious memories with loved ones.",
        },
        {
          image: "/images/story/generations.jpg",
          title: "Generations Together",
          description: "These memories connect generations and tell our family stories.",
        },
        {
          image: "/images/story/hospital.jpg",
          title: "Life's Transitions",
          description: "When loved ones pass, their memories become even more precious.",
        },
        {
          image: "/images/story/disaster.jpg",
          title: "Unexpected Loss",
          description: "Disasters and technology changes can erase our digital legacy.",
        },
        {
          image: "/images/story/preserved.jpg",
          title: "Preserved Forever",
          description: "With Futura, your memories are safe and accessible for generations.",
        },
      ];
    }

    return [
      {
        image: `/images/story/${journeyType}/scene1.jpg`,
        title: journeyDict.scene1?.title || "Scene 1",
        description: journeyDict.scene1?.description || "Description 1",
      },
      {
        image: `/images/story/${journeyType}/scene2.jpg`,
        title: journeyDict.scene2?.title || "Scene 2",
        description: journeyDict.scene2?.description || "Description 2",
      },
      {
        image: `/images/story/${journeyType}/scene3.jpg`,
        title: journeyDict.scene3?.title || "Scene 3",
        description: journeyDict.scene3?.description || "Description 3",
      },
      {
        image: `/images/story/${journeyType}/scene4.jpg`,
        title: journeyDict.scene4?.title || "Scene 4",
        description: journeyDict.scene4?.description || "Description 4",
      },
      {
        image: `/images/story/${journeyType}/scene5.jpg`,
        title: journeyDict.scene5?.title || "Scene 5",
        description: journeyDict.scene5?.description || "Description 5",
      },
    ];
  };

  const scenes = getScenes();
  const conclusion =
    dict?.valueJourneys?.[journeyType]?.conclusion ||
    "Don't risk losing what matters most. Preserve your legacy with Futura.";

  return (
    <section id="learn-more" className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {scenes.map((scene, index) => (
            <SceneItem key={index} scene={scene} index={index} isLast={index === scenes.length - 1} />
          ))}

          <div className="text-center mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-lg mb-6 max-w-2xl mx-auto">{conclusion}</p>
            <Button asChild size="lg">
              <Link href={`/${currentLang}/onboarding/items-upload`}>{dict?.hero?.startHere || "Start Here"}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Scene item component without animation library
function SceneItem({
  scene,
  index,
  isLast,
}: {
  scene: { image: string; title: string; description: string };
  index: number;
  isLast: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Alternate layout for even/odd scenes
  const isEven = index % 2 === 0;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`
        flex flex-col md:flex-row items-center 
        ${!isLast ? "mb-24" : "mb-8"} 
        ${isEven ? "" : "md:flex-row-reverse"}
        transition-opacity duration-700 ease-in-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
      `}
    >
      <div className="w-full md:w-1/2 mb-6 md:mb-0">
        <div className="relative h-64 md:h-80 overflow-hidden rounded-lg">
          <Image
            src={scene.image}
            alt={scene.title}
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
      </div>

      <div className={`w-full md:w-1/2 ${isEven ? "md:pl-12" : "md:pr-12"}`}>
        <h3 className="text-2xl font-bold mb-4">{scene.title}</h3>
        <p className="text-lg text-gray-600 dark:text-gray-400">{scene.description}</p>
      </div>

      {!isLast && (
        <div className="absolute left-1/2 transform -translate-x-1/2 mt-8 hidden md:block">
          <div className="h-16 w-0.5 bg-gray-300 dark:bg-gray-700"></div>
        </div>
      )}
    </div>
  );
}
