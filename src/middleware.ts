import { NextRequest, NextResponse } from "next/server";
import { match as matchLocale } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

export const locales = ["en", "fr", "es", "pt", "it", "de", "pl", "zh"];
export const defaultLocale = "en";

// const allowedOrigins = ["https://www.futura.now", "https://futura.now"];

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
  //   console.log("⛔ Middleware triggered at:", request.nextUrl.href);
  const pathname = request.nextUrl.pathname;
  //   const origin = request.headers.get("origin");

  // Handle PostHog CORS

  //   const isPosthogPath =
  //     pathname === "/ingest" ||
  //     pathname === "/decide" ||
  //     pathname === "/e" ||
  //     pathname.startsWith("/ingest/") ||
  //     pathname.startsWith("/decide/") ||
  //     pathname.startsWith("/static/") ||
  //     pathname.startsWith("/e/");

  //   if (isPosthogPath) {
  //     // Handle preflight
  //     if (request.method === "OPTIONS") {
  //       const response = new NextResponse(null, { status: 204 });
  //       if (origin && allowedOrigins.includes(origin)) {
  //         response.headers.set("Access-Control-Allow-Origin", origin);
  //         response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  //         response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  //         response.headers.set("Access-Control-Allow-Credentials", "true");
  //         response.headers.set("Access-Control-Max-Age", "86400");
  //       }
  //       return response;
  //     }

  //     if (origin && allowedOrigins.includes(origin)) {
  //       const response = NextResponse.next();
  //       response.headers.set("Access-Control-Allow-Origin", origin);
  //       response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  //       response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  //       response.headers.set("Access-Control-Allow-Credentials", "true");
  //       return response;
  //     }

  //     return NextResponse.next();
  //   }

  // Skip static files, API, and tests
  if (
    pathname.startsWith("/ingest") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/tests") ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|css|js|webp)$/)
  ) {
    return NextResponse.next();
  }

  //   if (isPosthogPath) {
  //     return NextResponse.next();
  //   }

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
