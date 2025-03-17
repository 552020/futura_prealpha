import { NextResponse } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { NextRequest } from "next/server";

// Define the locales you support
export const locales = ["en", "fr", "es", "pt", "it", "de", "pl", "zh"];
export const defaultLocale = "en";

/*
 * The getLocale function:
 * 1. Extracts HTTP headers from the incoming request
 * 2. Uses Negotiator to parse the Accept-Language header into an ordered array of preferred languages
 * 3. Uses intl-localematcher to find the best match between user preferences and supported locales
 * 4. Returns the best matching locale, or falls back to the default locale if no match is found
 * 5. Includes logging to help debug the language detection process
 */
// Get the preferred locale using negotiator and intl-localematcher
function getLocale(request: NextRequest) {
  console.log("getLocale called");

  // Define negotiatorHeaders with proper index signature
  const negotiatorHeaders: Record<string, string> = {};

  request.headers.forEach((value, key) => {
    negotiatorHeaders[key] = value;
    console.log(`Header: ${key} = ${value}`);
  });

  // Use negotiator and intl-localematcher to get the best locale
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
  console.log("Negotiator languages:", languages);

  const locale = match(languages, locales, defaultLocale);
  console.log("Matched locale:", locale);

  return locale;
}

// middleware function is a special function and a reserved word in next.js
export function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static files (images, etc.)
  if (
    pathname.startsWith("/_next") || // Skip Next.js system files
    pathname.includes("/api/") || // Skip API routes
    pathname.startsWith("/images/") || // Skip image files in the public directory
    pathname.match(/\.(png|jpg|jpeg|svg|ico|css|js|webp)$/) // Skip static files by extension
  ) {
    return;
  }

  // Check if there is any supported locale in the pathname
  // Extracts the pathname from the URL (e.g., "/about" from "https://example.com/about")
  console.log("Pathname:", pathname);
  // Check if the pathname does NOT start with any of the supported locales
  // returns true for "/about" but false for "/en/about"
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  console.log("pathnameIsMissingLocale:", pathnameIsMissingLocale);

  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);
    console.log("Detected locale:", locale);

    // Update URL
    const newUrl = new URL(`/${locale}${pathname.startsWith("/") ? "" : "/"}${pathname}`, request.url);
    console.log("Redirecting to:", newUrl.toString());

    return NextResponse.redirect(newUrl);
  } else {
    console.log("Pathname already has locale, no redirect needed");
  }

  // Redirect if there is no locale
  //   if (pathnameIsMissingLocale) {
  //     const locale = getLocale(request);
  //     console.log("Locale:", locale);
  //     return NextResponse.redirect(new URL(`/${locale}${pathname.startsWith("/") ? "" : "/"}${pathname}`, request.url));
  //   }
}

export const config = {
  // Match all request paths except for the ones starting with:
  // - api (API routes)
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
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
