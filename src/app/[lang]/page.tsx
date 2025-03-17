import Hero from "@/components/hero";
import ValueJourney from "@/components/value-journey";
import { getDictionary } from "@/utils/dictionaries";
import { cookies } from "next/headers";

type PageProps = {
  params: Promise<{
    lang: string;
  }>;
};

const DEFAULT_SEGMENT = "family";

export default async function LangPage({ params }: PageProps) {
  // Resolve the params promise
  const resolvedParams = await params;

  // Get the preferred segment from cookies, default to "family" if not found
  const cookieStore = await cookies();
  const segment = cookieStore.get("segment")?.value || DEFAULT_SEGMENT;

  // Get dictionary for the language WITH the preferred segment
  const dict = await getDictionary(resolvedParams.lang, { segment });

  return (
    <main>
      <Hero dict={dict} lang={resolvedParams.lang} />
      <ValueJourney dict={dict} lang={resolvedParams.lang} segment={segment} />
    </main>
  );
}
