# Language-Specific Content Handling

## Overview

This document explains how we handle language-specific content in our application, including how we pass and render content for different languages.

## Dictionary System

Our application uses a dictionary system to manage translations and language-specific content. The dictionary is loaded server-side and passed to components that need it.

### Server Components

Server components load the dictionary using `getDictionary`:

```typescript
const dict = await getDictionary(params.lang);
```

### Client Components

Client components receive the dictionary as a prop, and some also need the language parameter:

```typescript
interface ComponentProps {
  dict: Dictionary;
  lang?: string; // Only needed for components that use language-specific features
}
```

## Components and Language Parameter Usage

### Components That Need Language Parameter

1. **ValueJourney**

   - Uses `lang` for image paths and fallback
   - Example: `imagePath = `/images/segments/${journeyType}/scene_${sceneIndex}.webp`

2. **ItemsUploadClient**

   - Uses `lang` for navigation
   - Example: `router.push(`/${lang}/onboarding/profile`)`

3. **Header**

   - Uses `lang` for:
     - Logo link (`/${currentLang}`)
     - Navigation links
     - User button

4. **NavBar**
   - Uses `lang` for:
     - Navigation links (`/${lang}${item.href}`)
     - Translation validation

### Components That Don't Need Language Parameter

1. **Hero**

   - Only uses `dict` for translations
   - No language-specific features

2. **BottomNav**

   - Only uses `dict` for translations
   - No language-specific features

3. **Sidebar**
   - Only uses `dict` for translations
   - No language-specific features

## Why We Need the Language Parameter

### 1. Routing and Navigation

- When navigating between pages, we need to maintain the language in the URL
- Example:

```typescript
const router = useRouter();
router.push(`/${lang}/onboarding/profile`);
```

### 2. Language-Specific Features

- Date formatting
- Number formatting
- Currency display
- Example:

```typescript
const formattedDate = new Date().toLocaleDateString(lang);
```

### 3. API Calls

- Content localization in API responses
- Language-specific data fetching
- Example:

```typescript
const response = await fetch(`/api/content?lang=${lang}`);
```

### 4. Third-Party Integrations

- Some third-party services might need the language parameter
- Analytics tracking
- External content providers

## Ensuring Correct Language Dictionary

### Language Detection and Validation

1. **Route Parameter**

   - The language is determined from the URL route parameter `[lang]`
   - Example: `/en/about`, `/de/about`
   - This parameter is available in server components via `params.lang`

2. **Middleware Validation**

   - The `middleware.ts` file validates the language parameter
   - Only allows predefined languages (e.g., 'en', 'de')
   - Redirects to default language if invalid

3. **Dictionary Loading**

   - Server components load the correct dictionary using the validated language
   - Example:

   ```typescript
   // In a server component
   const dict = await getDictionary(params.lang);
   ```

4. **Client Component Props**
   - Server components pass both the dictionary and language to client components
   - Example:
   ```typescript
   // Server component
   return <ClientComponent dict={dict} lang={params.lang} />;
   ```

### Language-Specific Content Structure

1. **Dictionary Files**

   - Located in `src/dictionaries/`
   - Separate files for each language (e.g., `en.json`, `de.json`)
   - Consistent structure across all language files

2. **Content Organization**

   - Content is organized by feature/component
   - Example structure:

   ```json
   {
     "onboarding": {
       "items-upload": {
         "variations": {
           "leave-one-item": {
             "title": "Upload Your First Memory",
             "subtitle": "Start your journey by uploading a photo or document"
           }
         }
       }
     }
   }
   ```

3. **Type Safety**
   - TypeScript interfaces ensure consistent structure
   - Optional chaining prevents runtime errors
   - Fallback values for missing translations

### Common Pitfalls

1. **Incorrect Language Detection**

   - Always use the route parameter `params.lang`
   - Don't rely on browser language or localStorage
   - Avoid client-side language detection

2. **Missing Dictionary Entries**

   - Use optional chaining
   - Provide fallback values
   - Log missing translations for debugging

3. **Inconsistent Dictionary Structure**
   - Maintain consistent structure across all language files
   - Use TypeScript interfaces for validation
   - Regular checks for missing translations

## Components Using Language-Specific Content

### Page Components

1. `src/app/[lang]/page.tsx`

   - Uses dictionary for Hero and ValueJourney components
   - Passes `dict` and `lang` to child components

2. `src/app/[lang]/about/page.tsx`

   - Uses dictionary for about page content
   - Includes about-specific content via `includeAbout: true`

3. `src/app/[lang]/faq/page.tsx`

   - Uses dictionary for FAQ content
   - Renders accordion items with translated content

4. `src/app/[lang]/onboarding/items-upload/page.tsx`
   - Uses dictionary for onboarding content
   - Passes dictionary to client component

### Client Components

1. `src/components/hero.tsx`

   - Receives `dict` and `lang` as props
   - Renders translated hero content

2. `src/components/value-journey.tsx`

   - Receives `dict` and `lang` as props
   - Renders translated journey content

3. `src/components/sidebar.tsx`

   - Receives `dict` as prop
   - Uses translated navigation items

4. `src/components/header.tsx`

   - Receives `dict` and `lang` as props
   - Renders translated header content

5. `src/components/bottom-nav.tsx`
   - Receives `dict` as prop
   - Renders translated navigation items

### Layout Components

1. `src/app/[lang]/layout.tsx`
   - Loads dictionary for the entire app
   - Passes dictionary to Header, BottomNav, and Sidebar
   - Sets HTML lang attribute

## Dictionary Structure

The dictionary is structured hierarchically:

```typescript
interface Dictionary {
  onboarding?: {
    "items-upload"?: {
      variations?: {
        "leave-one-item"?: {
          title: string;
          subtitle: string;
        };
      };
    };
  };
  about?: {
    title: string;
    intro: string;
    missionTitle: string;
    missionText: string;
    visionTitle: string;
    visionText: string;
    teamTitle: string;
    teamText: string;
  };
  // ... other sections
}
```

## Best Practices

1. Always load dictionaries server-side when possible
2. Pass dictionary as prop to client components
3. Use optional chaining when accessing dictionary values
4. Provide fallback content when dictionary entries are missing
5. Keep dictionary structure consistent across components

## Common Issues

1. Missing dictionary entries

   - Solution: Use optional chaining and provide fallbacks

   ```typescript
   const title = dict.about?.title || "Default Title";
   ```

2. Type safety

   - Solution: Use TypeScript interfaces for dictionary structure
   - Consider making critical fields required

3. Hydration mismatches
   - Solution: Ensure consistent initial render between server and client
   - Use `suppressHydrationWarning` when necessary
