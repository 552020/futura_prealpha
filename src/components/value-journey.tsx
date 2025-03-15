"use client";

import Image from "next/image";
import { Dictionary } from "@/app/[lang]/dictionaries";
import { Button } from "./ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ValueJourney({ dict, lang }: { dict?: Dictionary; lang?: string }) {
  // Use the passed lang prop if available, otherwise default to "en"
  const currentLang = lang || "en";

  // Default texts for fallbacks
  const defaultTexts = {
    scene1: {
      title: "Creating Memories",
      description: "Throughout life, we create precious memories with loved ones.",
    },
    scene2: {
      title: "Generations Together",
      description: "These memories connect generations and tell our family stories.",
    },
    scene3: {
      title: "Life's Transitions",
      description: "When loved ones pass, their memories become even more precious.",
    },
    scene4: {
      title: "Unexpected Loss",
      description: "Disasters and technology changes can erase our digital legacy.",
    },
    scene5: {
      title: "Preserved Forever",
      description: "With Futura, your memories are safe and accessible for generations.",
    },
    conclusion: "Don't risk losing what matters most. Preserve your legacy with Futura.",
  };

  // Check for missing translations and log warnings in development
  if (process.env.NODE_ENV === "development") {
    if (!dict?.valueJourney?.scene1?.title) {
      console.warn(
        `[i18n] Missing translation for "valueJourney.scene1.title" in locale "${currentLang}". Using fallback.`
      );
    }
    // Add similar warnings for other fields if needed
  }

  const scenes = [
    {
      image: "/images/story/wedding.jpg",
      title: dict?.valueJourney?.scene1?.title || defaultTexts.scene1.title,
      description: dict?.valueJourney?.scene1?.description || defaultTexts.scene1.description,
    },
    {
      image: "/images/story/generations.jpg",
      title: dict?.valueJourney?.scene2?.title || defaultTexts.scene2.title,
      description: dict?.valueJourney?.scene2?.description || defaultTexts.scene2.description,
    },
    {
      image: "/images/story/hospital.jpg",
      title: dict?.valueJourney?.scene3?.title || defaultTexts.scene3.title,
      description: dict?.valueJourney?.scene3?.description || defaultTexts.scene3.description,
    },
    {
      image: "/images/story/disaster.jpg",
      title: dict?.valueJourney?.scene4?.title || defaultTexts.scene4.title,
      description: dict?.valueJourney?.scene4?.description || defaultTexts.scene4.description,
    },
    {
      image: "/images/story/preserved.jpg",
      title: dict?.valueJourney?.scene5?.title || defaultTexts.scene5.title,
      description: dict?.valueJourney?.scene5?.description || defaultTexts.scene5.description,
    },
  ];

  return (
    <section id="learn-more" className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-5 gap-4 mb-12">
          {scenes.map((scene, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col"
            >
              <div className="relative h-64 mb-4 overflow-hidden rounded-lg">
                <Image
                  src={scene.image}
                  alt={scene.title}
                  fill
                  className="object-cover transition-transform hover:scale-105"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">{scene.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{scene.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-lg mb-6 max-w-2xl mx-auto">{dict?.valueJourney?.conclusion || defaultTexts.conclusion}</p>
          <Button asChild size="lg">
            <Link href={`/${currentLang}/onboarding/items-upload`}>{dict?.home?.startHere || "Start Here"}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
