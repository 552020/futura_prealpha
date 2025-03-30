import { NextRequest, NextResponse } from "next/server";
import { match as matchLocale } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

export const locales = ["en", "fr", "es", "pt", "it", "de", "pl", "zh"];
export const defaultLocale = "en";

const allowedOrigins = ["https://www.futura.now", "https://futura.now", "https://peek.futura.now"];

function getLocale(request: NextRequest): string | undefined {
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    negotiatorHeaders[key] = value;
  });
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
  const locale = matchLocale(languages, locales, defaultLocale);
  return locale;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const origin = request.headers.get("origin");

  // Minimal logging for all PostHog paths
  const shouldLog =
    pathname.includes("/decide") ||
    pathname.includes("/e") ||
    pathname.includes("/ingest") ||
    pathname.includes("/array") ||
    pathname.includes("/i") ||
    pathname.includes("/s");

  if (shouldLog) {
    console.log("🔥 PostHog route hit:");
    console.log("  → Method:", request.method);
    console.log("  → Origin:", origin);
    console.log("  → Pathname:", pathname);
  }

  // Handle PostHog paths
  const isPosthogPath =
    pathname === "/ingest" ||
    pathname === "/decide" ||
    pathname === "/e" ||
    pathname === "/s" ||
    pathname === "/array" ||
    pathname === "/i" ||
    pathname.startsWith("/ingest/") ||
    pathname.startsWith("/decide/") ||
    pathname.startsWith("/static/") ||
    pathname.startsWith("/e/") ||
    pathname.startsWith("/array/") ||
    pathname.startsWith("/i/") ||
    pathname.startsWith("/s/");

  // Handle PostHog requests with CORS
  if (isPosthogPath) {
    // Handle preflight
    if (request.method === "OPTIONS") {
      const response = new NextResponse(null, { status: 204 });
      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set("Access-Control-Allow-Origin", origin);
        response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.headers.set("Access-Control-Allow-Credentials", "true");
        response.headers.set("Access-Control-Max-Age", "86400");
      }
      return response;
    }

    // Handle actual request
    const response = NextResponse.next();
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set("Access-Control-Expose-Headers", "*");
    }
    return response;
  }

  // Skip static files, API, and tests
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/tests") ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|css|js|webp)$/)
  ) {
    return NextResponse.next();
  }

  // Handle localization for all other paths
  const missingLocale = locales.every((locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`);

  if (missingLocale) {
    const locale = getLocale(request);
    return NextResponse.redirect(new URL(`/${locale}${pathname.startsWith("/") ? "" : "/"}${pathname}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
