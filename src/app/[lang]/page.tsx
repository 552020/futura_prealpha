import Hero from "@/components/hero";
import ValueJourney from "@/components/value-journey";
import { getDictionary } from "./dictionaries";

export default async function HomePage({ params }: { params: { lang: string } }) {
  const dict = await getDictionary(params.lang);

  return (
    <main>
      <Hero dict={dict} lang={params.lang} />
      <ValueJourney dict={dict} lang={params.lang} />
    </main>
  );
}
