// app/[lang]/[segment]/page.tsx
import Hero from "@/components/hero";
import ValueJourney from "@/components/value-journey";
import { getDictionary } from "@/app/[lang]/dictionaries/dictionaries";
import { notFound } from "next/navigation";

// Define valid segments
const validSegments = ["family", "wedding", "creative", "black-mirror"];

// Define the correct type for the page props in Next.js 14+
type PageProps = {
  params: Promise<{
    lang: string;
    segment: string;
  }>;
};

export default async function SegmentPage({ params }: PageProps) {
  // Resolve the params promise
  const resolvedParams = await params;

  // Validate segment
  if (!validSegments.includes(resolvedParams.segment)) {
    notFound(); // Return 404 for invalid segments
  }

  // Get dictionary with segment-specific content
  const dict = await getDictionary(resolvedParams.lang, resolvedParams.segment);

  return (
    <main>
      <Hero dict={dict} lang={resolvedParams.lang} segment={resolvedParams.segment} />
      <ValueJourney dict={dict} lang={resolvedParams.lang} segment={resolvedParams.segment} />
    </main>
  );
}
