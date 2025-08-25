import Hero from "@/components/hero";
import HeroDemo from "@/components/hero-demo";
import { getDictionary } from "@/utils/dictionaries";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    lang: string;
  }>;
};

const DEFAULT_SEGMENT = "family";

export default async function LangPage({ params }: PageProps) {
  // Resolve the params promise
  const resolvedParams = await params;

  // Check if user is authenticated
  const session = await auth();

  // If authenticated, redirect to dashboard
  if (session?.user?.id) {
    redirect(`/${resolvedParams.lang}/dashboard`);
  }

  // Get the preferred segment from cookies, default to "family" if not found
  const cookieStore = await cookies();
  const segment = cookieStore.get("segment")?.value || DEFAULT_SEGMENT;

  // Get dictionary for the language WITH the preferred segment
  const dict = await getDictionary(resolvedParams.lang, { segment });

  return (
    <main className="bg-white dark:bg-[#0A0A0B]">
      <Hero dict={dict} lang={resolvedParams.lang} />
      <HeroDemo dict={dict} lang={resolvedParams.lang} />
      {/* <ValueJourney dict={dict} lang={resolvedParams.lang} segment={segment} /> */}
    </main>
  );
}
