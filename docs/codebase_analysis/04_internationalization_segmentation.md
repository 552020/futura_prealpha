# Internationalization & Segmentation Analysis

## Overview

Futura implements a sophisticated **internationalization (i18n)** system combined with **user segmentation** to deliver personalized, multi-language experiences. The system supports **8 languages** and **multiple user segments** with dynamic content delivery.

## Internationalization Architecture

### 1. Language Support

**Supported Languages**:

```typescript
export const locales = ["en", "fr", "es", "pt", "it", "de", "pl", "zh"];
export const defaultLocale = "en";
```

- **English** (en) - Default and fallback language
- **French** (fr) - Français
- **Spanish** (es) - Español
- **Portuguese** (pt) - Português
- **Italian** (it) - Italiano
- **German** (de) - Deutsch
- **Polish** (pl) - Polski
- **Chinese** (zh) - 中文

### 2. URL Structure & Routing

#### Path-Based Internationalization

```
/{lang}/                    # Base language route
/{lang}/[segment]/          # Segment-specific route
/{lang}/onboarding/         # Feature routes
/{lang}/user/dashboard/     # Nested routes
```

**Examples**:

- `/en/` - English homepage
- `/fr/family/` - French family segment
- `/de/onboarding/` - German onboarding
- `/zh/user/profile/` - Chinese user profile

#### Middleware Implementation

```typescript
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Handle localization for all paths
  const missingLocale = locales.every((locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`);

  if (missingLocale) {
    const locale = getLocale(request);
    return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
  }
}
```

**Features**:

- **Automatic locale detection** using `Accept-Language` header
- **Locale negotiation** with `@formatjs/intl-localematcher`
- **Fallback to default locale** when unsupported language detected
- **Static file exclusion** for performance

### 3. Dictionary System Architecture

#### Dictionary Type Hierarchy

```typescript
// Base dictionary for common UI elements
type BaseDictionary = {
  metadata?: { title?: string; description?: string };
  hero?: { title?: string; subtitle?: string };
  header?: { signIn?: string };
  nav?: { about?: string; profile?: string };
  footer?: { tagline?: string };
  onboarding?: { upload?: { title?: string } };
};

// Segment-specific content
type ValueJourneyDictionary = {
  valueJourney?: {
    scene1?: { title?: string; subtitle?: string };
    scene2?: { title?: string; subtitle?: string };
    // ... up to scene5
    conclusion?: string;
  };
};

// Combined dictionary type
type Dictionary = BaseDictionary & ValueJourneyDictionary & AboutDictionary & FAQDictionary & OnboardingDictionary;
```

#### Dictionary Loading Strategy

```typescript
export const getDictionary = async (
  locale: string,
  options?: {
    segment?: string;
    includeAbout?: boolean;
    includeFAQ?: boolean;
    includeOnboarding?: boolean;
  }
): Promise<Dictionary> => {
  // 1. Load base dictionary
  const baseDictionary = await dictionaries[locale]();
  let result: Dictionary = { ...baseDictionary };

  // 2. Load segment-specific content if requested
  if (options?.segment) {
    const segmentDict = await segmentDictionaries[options.segment]?.[locale]();
    result = { ...result, ...segmentDict };
  }

  // 3. Load page-specific content if requested
  if (options?.includeOnboarding) {
    const onboardingDict = await onboardingDictionaries[locale]();
    result = { ...result, ...onboardingDict };
  }

  return result;
};
```

**Key Features**:

- **Lazy loading** with dynamic imports
- **Fallback mechanism** to English when translations missing
- **Modular content loading** (base + segment + page-specific)
- **Type safety** with TypeScript interfaces
- **Optional fields** for development flexibility

### 4. File Organization Structure

```
src/app/[lang]/dictionaries/
├── base/                   # Core UI translations
│   ├── en.json            # English base
│   ├── fr.json            # French base
│   ├── es.json            # Spanish base
│   └── [other-langs].json
├── segments/              # Segment-specific content
│   ├── family/
│   │   ├── en.json       # Family segment English
│   │   ├── de.json       # Family segment German
│   │   └── family.md     # Documentation
│   └── black-mirror/
│       ├── en.json       # Black Mirror segment
│       └── de.json
├── onboarding/           # Onboarding flow content
│   ├── en.json
│   └── de.json
├── about/                # About page content
├── faq/                  # FAQ content
└── [other-features]/
```

## User Segmentation System

### 1. Segment Types

**Current Segments**:

1. **Family** - Users focused on family history and generational connections
2. **Black Mirror** - Tech-savvy users interested in digital preservation
3. **Creative** - Artists, writers, and creators (planned)
4. **Business** - Organizations preserving institutional knowledge (planned)
5. **Academic** - Researchers and educators (planned)

### 2. Segmentation Implementation

#### Cookie-Based Segment Storage

```typescript
// In page component
const cookieStore = await cookies();
const segment = cookieStore.get("segment")?.value || DEFAULT_SEGMENT;

// Load segment-specific dictionary
const dict = await getDictionary(resolvedParams.lang, { segment });
```

#### Segment-Specific Content Example

```json
// family/en.json
{
  "valueJourney": {
    "scene1": {
      "image": "/images/segments/family/diana_charles.jpg",
      "title": "Some moments stand apart",
      "subtitle": "They define who you are"
    },
    "scene2": {
      "title": "Moments turn into memories",
      "subtitle": "Held closely in our hearts, passed down through generations"
    }
  }
}
```

#### Dynamic Content Variations

```json
{
  "variations": {
    "valueJourney": {
      "scene1": {
        "titles": ["Some moments stand apart", "They shape who we become"],
        "subtitles": ["They define our story", "Some moments stand apart"]
      }
    }
  }
}
```

**Purpose**: Enables A/B testing and dynamic content delivery within segments.

### 3. Routing Integration

#### Dual Route Support

```typescript
// Both patterns supported:
/{lang}/                   # Default segment from cookie
/{lang}/[segment]/         # Explicit segment in URL

// Component receives segment
<ValueJourney
  dict={dict}
  lang={lang}
  segment={segment}
/>
```

#### Segment Detection Logic

```typescript
const ValueJourney: React.FC<ValueJourneyProps> = ({ dict, lang, segment = "family" }) => {
  // Validate segment is supported
  const journeyType = (segment as JourneyType) || "family";

  // Dynamic image path based on segment
  const imagePath = `/images/segments/${journeyType}/scene_${sceneIndex}.webp`;
};
```

## Content Delivery Strategy

### 1. Server-Side Dictionary Loading

#### Page-Level Loading

```typescript
export default async function LangPage({ params }: PageProps) {
  const resolvedParams = await params;
  const cookieStore = await cookies();
  const segment = cookieStore.get("segment")?.value || DEFAULT_SEGMENT;

  // Load dictionary with segment
  const dict = await getDictionary(resolvedParams.lang, { segment });

  return (
    <main>
      <Hero dict={dict} lang={resolvedParams.lang} />
      <ValueJourney dict={dict} lang={resolvedParams.lang} segment={segment} />
    </main>
  );
}
```

#### Layout-Level Integration

```typescript
export default async function RootLayout({ children, params }) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang);

  return (
    <html lang={resolvedParams.lang}>
      <body>
        <Header dict={dict} lang={resolvedParams.lang} />
        <Sidebar dict={dict} />
        <main>{children}</main>
      </body>
    </html>
  );
}
```

### 2. Component Integration Patterns

#### Dictionary-Only Components

```typescript
// Components that only need translations
interface HeroProps {
  dict: Dictionary;
  lang: string; // For metadata/SEO only
}

const Hero = ({ dict, lang }: HeroProps) => (
  <section>
    <h1>{dict.hero?.title}</h1>
    <p>{dict.hero?.subtitle}</p>
  </section>
);
```

#### Language-Aware Components

```typescript
// Components that need language for functionality
interface HeaderProps {
  dict: Dictionary;
  lang: string; // For navigation and routing
}

const Header = ({ dict, lang }: HeaderProps) => (
  <header>
    <Link href={`/${lang}`}>{dict.nav?.home}</Link>
    <LanguageSwitcher currentLang={lang} />
  </header>
);
```

### 3. Fallback Mechanisms

#### Language Fallbacks

1. **Requested locale** (e.g., `fr`)
2. **English fallback** if locale unsupported
3. **Error handling** with console warnings

#### Content Fallbacks

1. **Segment-specific content** (e.g., `family/fr.json`)
2. **English segment content** if locale missing
3. **Base dictionary** if segment content missing
4. **Default values** in components

## Performance Optimizations

### 1. Dynamic Imports

```typescript
const dictionaries: Record<string, () => Promise<BaseDictionary>> = {
  en: () => import("../app/[lang]/dictionaries/base/en.json"),
  fr: () => import("../app/[lang]/dictionaries/base/fr.json"),
  // ... other languages
};
```

**Benefits**:

- **Code splitting** by language
- **Lazy loading** of unused languages
- **Reduced initial bundle size**

### 2. Static Generation

```typescript
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}
```

**Benefits**:

- **Pre-generated pages** for all languages
- **Improved SEO** with static HTML
- **Better performance** with CDN caching

### 3. Middleware Optimization

```typescript
// Skip processing for static files
if (
  pathname.startsWith("/_next") ||
  pathname.startsWith("/images") ||
  pathname.match(/\.(png|jpg|jpeg|svg|ico|css|js|webp)$/)
) {
  return NextResponse.next();
}
```

## SEO & Accessibility

### 1. HTML Lang Attribute

```typescript
<html lang={resolvedParams.lang} suppressHydrationWarning>
```

### 2. Meta Tags

```json
{
  "metadata": {
    "title": "Futura - Live Forever",
    "description": "Your digital vault for memories that matter."
  }
}
```

### 3. Language Switcher

```typescript
const handleLanguageChange = (locale: string) => {
  window.location.href = getPathWithNewLocale(locale);
};
```

## Current Implementation Status

### ✅ Implemented Features

- **8-language support** with automatic detection
- **Path-based routing** with middleware
- **Dictionary system** with lazy loading
- **Segment-specific content** delivery
- **Cookie-based segment** preferences
- **Fallback mechanisms** for missing content
- **Type-safe interfaces** for all dictionaries

### 🚧 Areas for Enhancement

- **Segment detection algorithm** could be more sophisticated
- **A/B testing integration** for content variations
- **Analytics tracking** for segment performance
- **More granular content** loading strategies
- **Better error handling** for missing translations

### 📋 Best Practices Observed

- **Optional field strategy** for development flexibility
- **Hierarchical fallbacks** (locale → English → default)
- **Performance optimization** with dynamic imports
- **Type safety** throughout the system
- **Clear separation** between base and segment content

This internationalization and segmentation system provides a solid foundation for delivering personalized, multi-language experiences while maintaining performance and developer experience.
