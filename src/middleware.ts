import { NextRequest, NextResponse } from "next/server";
import { match as matchLocale } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

// Define the locales you support
export const locales = ["en", "fr", "es", "pt", "it", "de", "pl", "zh"];
export const defaultLocale = "en";

const allowedOrigins = ["https://www.futura.now", "https://futura.now"];

/*
 * The getLocale function:
 * 1. Extracts HTTP headers from the incoming request
 * 2. Uses Negotiator to parse the Accept-Language header into an ordered array of preferred languages
 * 3. Uses intl-localematcher to find the best match between user preferences and supported locales
 * 4. Returns the best matching locale, or falls back to the default locale if no match is found
 * 5. Includes logging to help debug the language detection process
 */
// Get the preferred locale using negotiator and intl-localematcher
function getLocale(request: NextRequest): string | undefined {
  //   console.log("getLocale called");

  // Define negotiatorHeaders with proper index signature
  const negotiatorHeaders: Record<string, string> = {};

  request.headers.forEach((value, key) => {
    negotiatorHeaders[key] = value;
    // console.log(`Header: ${key} = ${value}`);
  });

  // Use negotiator and intl-localematcher to get the best locale
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
  //   console.log("Negotiator languages:", languages);

  const locale = matchLocale(languages, locales, defaultLocale);
  //   console.log("Matched locale:", locale);

  return locale;
}

// middleware function is a special function and a reserved word in next.js
export function middleware(request: NextRequest) {
  console.log("⛔ Middleware triggered at:", request.nextUrl.href);
  const pathname = request.nextUrl.pathname;

  // Handle CORS for PostHog endpoints
  if (
    pathname.startsWith("/ingest/") ||
    pathname.startsWith("/decide/") ||
    pathname.startsWith("/static/") ||
    pathname.startsWith("/e/")
  ) {
    const origin = request.headers.get("origin");

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      const response = new NextResponse(null, { status: 204 });
      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set("Access-Control-Allow-Origin", origin);
        response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type");
        response.headers.set("Access-Control-Allow-Credentials", "true");
        response.headers.set("Access-Control-Max-Age", "86400");
      }
      return response;
    }

    // Handle actual requests
    if (origin && allowedOrigins.includes(origin)) {
      const response = NextResponse.next();
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type");
      response.headers.set("Access-Control-Allow-Credentials", "true");
      return response;
    }

    return NextResponse.next();
  }

  // Handle i18n routing
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);
    return NextResponse.redirect(new URL(`/${locale}${pathname.startsWith("/") ? "" : "/"}${pathname}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // PostHog endpoints
    "/ingest/:path*",
    "/decide/:path*",
    "/static/:path*",
    "/e/:path*",
    // i18n routes (but exclude all API, static, and asset paths)
    "/((?!api|_next|images|assets|favicon.ico|sw.js).*)",
  ],
};

/*
 * PACKAGE EXPLANATIONS:
 *
 * 1. @formatjs/intl-localematcher:
 *    - Implements the locale negotiation algorithm (RFC 4647)
 *    - The 'match' function finds the best locale match between user preferences and supported locales
 *    - It takes user's preferred languages, our supported locales, and a default locale
 *    - Returns the best matching locale based on these inputs
 *
 * 2. Negotiator:
 *    - Parses HTTP headers for content negotiation
 *    - The 'languages()' method extracts and orders language preferences from the Accept-Language header
 *    - It respects quality values (q-values) to determine the user's language priority
 *    - Provides an ordered array of language codes that represent user preferences
 *
 * 3. NextResponse:
 *    - Part of Next.js server middleware API
 *    - Used to create and return HTTP responses from middleware
 *    - The 'redirect()' method creates a redirect response to send users to the localized URL
 *    - Allows us to modify the request/response cycle before rendering pages
 */

// Creating the Path String:
// `
// This builds the new path with the locale prefix: - /${locale} - Adds the detected locale with a leading slash (e.g., "/de") - ${pathname.startsWith("/") ? "" : "/"} - This is a conditional to prevent double slashes: - If pathname already starts with "/", add nothing - If pathname doesn't start with "/", add a "/" - ${pathname} - Adds the original pathname Examples: - If pathname is "/about" → "/de/about" (avoids "/de//about") - If pathname is "products" → "/de/products" (adds necessary slash)2. **Creating a URL Object**: js new URL(path, request.url) - Creates a new URL object using: - The path we constructed above - The original request URL as the base - This preserves other URL components like: - Protocol (http/https) - Domain - Port - Query parameters - Hash fragments Example: - If request.url is "https://example.com/about?id=123" - The new URL becomes "https://example.com/de/about?id=123"3. **Creating the Redirect Response**: js NextResponse.redirect(url) - Creates an HTTP redirect response (status 307 Temporary Redirect) - Tells the browser to navigate to the new URL - Preserves the original HTTP method (GET, POST, etc.)## What This Accomplishes:This line ensures that:1. Users are redirected to the same page but with their preferred locale in the URL2. The URL structure is clean (no double slashes)3. All URL components (query parameters, etc.) are preserved4. The redirect happens with the appropriate HTTP status codeIt's a crucial part of the internationalization strategy, ensuring all pages are accessed with the proper language context in the URL.
