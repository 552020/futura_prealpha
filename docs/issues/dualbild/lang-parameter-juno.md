# How [lang] Parameter Works on Juno

## Overview

This document explains how the `[lang]` dynamic route parameter functions on Juno's static hosting platform, despite Juno not supporting server-side rendering or dynamic server features. The key is understanding how Next.js **static export** with **`generateStaticParams`** pre-renders all language routes at build time.

## The Challenge

Juno is a static hosting platform that runs on the Internet Computer blockchain. It has the following limitations:

- ❌ No Server-Side Rendering (SSR)
- ❌ No API routes
- ❌ No server components at runtime
- ❌ No middleware
- ❌ No dynamic server processing

Yet our `[lang]` routing works perfectly. How?

## The Solution: Static Pre-Generation

### 1. Next.js Configuration

The foundation is in our `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  output: "export", // This is crucial!
  images: {
    unoptimized: true, // Required for static export
  },
};
```

The `output: "export"` tells Next.js to generate **static HTML files** for all routes at build time instead of rendering them on-demand.

### 2. Language Route Structure

Our app structure uses dynamic routing:

```
src/app/
└── [lang]/
    ├── layout.tsx
    ├── page.tsx
    ├── about/
    │   └── page.tsx
    ├── faq/
    │   └── page.tsx
    └── [segment]/
        └── page.tsx
```

### 3. Static Params Generation

In `/src/app/[lang]/layout.tsx`, we define which language routes to pre-generate:

```typescript
// Define supported locales
const locales = ["en", "fr", "es", "pt", "it", "de", "pl", "zh"];

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}
```

This function returns:

```javascript
[
  { lang: "en" },
  { lang: "fr" },
  { lang: "es" },
  { lang: "pt" },
  { lang: "it" },
  { lang: "de" },
  { lang: "pl" },
  { lang: "zh" },
];
```

### 4. Build-Time Dictionary Loading

What looks like server-side code actually runs at **build time**:

```typescript
export default async function RootLayout({ children, params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;

  // This runs at BUILD TIME, not runtime!
  const dict = await getDictionary(lang);

  return (
    <html lang={lang}>
      <body>
        <Header dict={dict} lang={lang} />
        {children}
      </body>
    </html>
  );
}
```

## How the Build Process Works

### Step 1: Static Generation Execution

When you run `npm run build`:

1. **Next.js calls `generateStaticParams()`** for each dynamic route
2. **For each language returned**, Next.js:
   - Executes the page/layout components
   - Calls `getDictionary(lang)`
   - Loads the appropriate translation files
   - Renders the complete HTML with translations

### Step 2: File Structure Created

The build process creates static files like this:

```
out/
├── en/
│   ├── index.html          (English homepage)
│   ├── about/
│   │   └── index.html      (English about page)
│   ├── faq/
│   │   └── index.html      (English FAQ)
│   └── family/
│       └── index.html      (English family segment)
├── fr/
│   ├── index.html          (French homepage)
│   ├── about/
│   │   └── index.html      (French about page)
│   └── ...
├── de/
│   ├── index.html          (German homepage)
│   └── ...
└── ... (all other languages)
```

### Step 3: Translation Embedding

Each HTML file contains the **pre-rendered content** with translations already embedded:

```html
<!-- en/index.html -->
<html lang="en">
  <body>
    <h1>Futura - Live Forever</h1>
    <p>Your digital vault for memories that matter.</p>
  </body>
</html>

<!-- fr/index.html -->
<html lang="fr">
  <body>
    <h1>Futura - Vivre pour Toujours</h1>
    <p>Votre coffre-fort numérique pour les souvenirs qui comptent.</p>
  </body>
</html>
```

## Dictionary System Architecture

### Base Dictionary Structure

```typescript
// src/utils/dictionaries.ts
const dictionaries: Record<string, () => Promise<BaseDictionary>> = {
  en: () => import("../app/[lang]/dictionaries/base/en.json"),
  fr: () => import("../app/[lang]/dictionaries/base/fr.json"),
  de: () => import("../app/[lang]/dictionaries/base/de.json"),
  // ... other languages
};
```

### Specialized Dictionaries

The system supports different types of content:

- **Base dictionaries**: Common UI elements (`/dictionaries/base/`)
- **Segment dictionaries**: Content-specific translations (`/dictionaries/segments/`)
- **Page dictionaries**: Page-specific content (`/dictionaries/about/`, `/dictionaries/faq/`)

### Build-Time Loading

```typescript
export const getDictionary = async (
  locale: string,
  options?: {
    segment?: string;
    includeAbout?: boolean;
    includeFAQ?: boolean;
  }
) => {
  // Load base dictionary
  const baseDictionary = await dictionaries[locale]();

  // Merge with specialized dictionaries if requested
  if (options?.segment) {
    const segmentDict = await segmentDictionaries[options.segment][locale]();
    return { ...baseDictionary, ...segmentDict };
  }

  return baseDictionary;
};
```

## Language Switching Mechanism

### Client-Side Navigation

The `LanguageSwitcher` component works with static files:

```typescript
export function LanguageSwitcher() {
  const pathname = usePathname();
  const params = useParams();
  const lang = params.lang as string;

  const getPathWithNewLocale = (locale: string) => {
    const segments = pathname.split("/");
    segments[1] = locale; // Replace the language segment
    return segments.join("/");
  };

  const handleLanguageChange = (locale: string) => {
    // Full page reload to the pre-built static file
    window.location.href = getPathWithNewLocale(locale);
  };

  // ... rest of component
}
```

### Why This Works

1. **Each language route exists as a static file**
2. **No server processing required** - just serving different HTML files
3. **URL structure matches file structure** (`/fr/about` → `out/fr/about/index.html`)

## Juno Deployment Configuration

### Juno Config

```typescript
// juno.config.ts
export default defineConfig({
  satellite: {
    id: "ucnx3-aqaaa-aaaal-ab3ea-cai",
    source: "out", // Points to Next.js build output
    predeploy: ["npm run build"], // Builds static files before deploy
  },
});
```

### Deployment Process

1. **`npm run build`** generates static files in `out/` directory
2. **Juno uploads** all static files to the Internet Computer
3. **Users request** `/fr/about`
4. **Juno serves** the pre-built `out/fr/about/index.html` file

## Advantages of This Approach

### Performance Benefits

- ✅ **Lightning fast**: No server processing, just static file serving
- ✅ **CDN-friendly**: Files can be cached globally
- ✅ **Scalable**: No server resources needed per request
- ✅ **Reliable**: No server downtime possible

### SEO Benefits

- ✅ **Perfect SEO**: Each language has its own URL and HTML
- ✅ **Meta tags**: Language-specific metadata pre-rendered
- ✅ **Search engine friendly**: Static HTML is easily crawlable

### Development Benefits

- ✅ **Type safety**: Full TypeScript support during build
- ✅ **Error catching**: Build fails if translations are missing
- ✅ **Performance**: No runtime dictionary loading

## Limitations and Considerations

### Static Content Only

- ❌ **No real-time updates**: Content is fixed at build time
- ❌ **No user-specific content**: Same HTML served to all users
- ❌ **Build time increases**: More languages = longer build times

### Language Management

- ⚠️ **Adding languages**: Requires code changes and rebuild
- ⚠️ **Translation updates**: Require full rebuild and redeploy
- ⚠️ **Fallback handling**: Must be implemented at build time

## Best Practices

### 1. Efficient Dictionary Structure

```typescript
// Good: Modular dictionaries
const dict = await getDictionary(lang, {
  segment: "family",
  includeAbout: true,
});

// Avoid: Loading all translations for every page
const dict = await getDictionary(lang, {
  includeEverything: true,
});
```

### 2. Fallback Strategy

```typescript
export const getDictionary = async (locale: string) => {
  // Always have fallback to English
  if (!locales.includes(locale)) {
    console.warn(`Locale ${locale} not supported, falling back to English`);
    locale = "en";
  }

  const baseDictionary = await dictionaries[locale]();
  return baseDictionary;
};
```

### 3. Build Optimization

```typescript
// Use dynamic imports for better code splitting
const dictionaries: Record<string, () => Promise<BaseDictionary>> = {
  en: () => import("../app/[lang]/dictionaries/base/en.json").then((m) => m.default),
  fr: () => import("../app/[lang]/dictionaries/base/fr.json").then((m) => m.default),
};
```

## Debugging and Development

### Development vs Production

- **Development**: Server components work normally with hot reload
- **Production**: Static files served from Juno's Internet Computer nodes

### Common Issues

1. **Missing translations**: Build will fail if required translations are missing
2. **Route conflicts**: Ensure `generateStaticParams` covers all needed routes
3. **Image optimization**: Remember `unoptimized: true` for static export

### Verification

To verify your setup works:

1. Run `npm run build`
2. Check the `out/` directory structure
3. Serve locally: `npx serve out`
4. Test language switching manually

## Conclusion

The `[lang]` parameter works on Juno because **Next.js static export** transforms what appears to be dynamic server-side routing into **pre-built static files**. The "magic" happens at build time:

- `generateStaticParams` defines which routes to pre-render
- Dictionary loading happens during build, not at runtime
- Each language gets its own static HTML files
- Juno simply serves the appropriate static file based on the URL

This approach provides the benefits of internationalization with the performance and reliability of static hosting, making it perfect for deployment on Juno's Internet Computer infrastructure.
