// app/[lang]/[segment]/page.tsx
import Hero from "@/components/hero";
import ValueJourney from "@/components/value-journey";
import { getDictionary } from "@/utils/dictionaries";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";

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

  // Set the segment cookie using the cookies API
  const cookieStore = await cookies();
  cookieStore.set("segment", resolvedParams.segment, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    sameSite: "lax",
  });

  // Get dictionary with segment-specific content
  const dict = await getDictionary(resolvedParams.lang, { segment: resolvedParams.segment });

  return (
    <main>
      <Hero dict={dict} lang={resolvedParams.lang} />
      <ValueJourney dict={dict} lang={resolvedParams.lang} segment={resolvedParams.segment} />
    </main>
  );
}
