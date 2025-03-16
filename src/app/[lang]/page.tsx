import Hero from "@/components/hero";
import ValueJourney from "@/components/value-journey";
import { getDictionary } from "@/utils/dictionaries";

// Define the correct type for the page props in Next.js 14+
type PageProps = {
  params: Promise<{
    lang: string;
  }>;
};

export default async function LangPage({ params }: PageProps) {
  // Resolve the params promise
  const resolvedParams = await params;

  // Get dictionary for the language
  const dict = await getDictionary(resolvedParams.lang);

  return (
    <main>
      <Hero dict={dict} lang={resolvedParams.lang} segment="family" />
      <ValueJourney dict={dict} lang={resolvedParams.lang} segment="family" />
    </main>
  );
}
