import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "next-auth/react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { InterfaceProvider } from "@/contexts/interface-context";
import { OnboardingProvider } from "@/contexts/onboarding-context";
import { locales } from "@/middleware";
import { notFound } from "next/navigation";
import { getDictionary, Dictionary } from "@/app/[lang]/dictionaries";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Dynamic metadata based on the current language
export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  // Get the dictionary for the current language
  const dict: Dictionary = await getDictionary(params.lang);

  return {
    title: dict.metadata.title || "Futura",
    description: dict.metadata.description || "Live forever. Now.",
    openGraph: {
      title: dict.metadata.title || "Futura",
      description: dict.metadata.description || "Live forever. Now.",
      locale: params.lang,
    },
  };
}

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { lang: string };
}>) {
  // Check if the language is supported
  if (!locales.includes(params.lang)) {
    notFound();
  }

  // Load the dictionary for the current language
  const dict = await getDictionary(params.lang);

  return (
    <html lang={params.lang} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}>
        <SessionProvider basePath="/api/auth">
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <div className="relative min-h-screen flex flex-col">
              <InterfaceProvider>
                <OnboardingProvider>
                  <Header dict={dict} lang={params.lang} />
                  <main className="flex-1">{children}</main>
                  <Footer dict={dict} />
                </OnboardingProvider>
              </InterfaceProvider>
            </div>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
