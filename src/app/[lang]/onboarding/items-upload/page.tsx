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
