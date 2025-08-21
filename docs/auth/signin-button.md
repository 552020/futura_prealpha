# Sign-in Button Implementation

## Component Structure

### 1. Layout and Header Components

The sign-in functionality is integrated into the application through a hierarchical component structure:

#### `src/app/[lang]/layout.tsx`

```typescript
// Main layout component that wraps all pages
export default function RootLayout({
  children,
  params: { lang },
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
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

#### `src/components/header.tsx`

```typescript
export default function Header({ dict, lang }: { dict: HeaderDictionary; lang?: string }) {
  const { mode } = useInterface();
  const currentLang = lang || "en";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo section */}
        <section className="logo-section flex items-center">
          <Link href={`/${currentLang}`}>{/* Logo content */}</Link>
        </section>

        {/* Desktop Navigation */}
        <nav className="navigation-section hidden md:flex flex-1 justify-center gap-6">
          <NavBar mode={mode} lang={currentLang} dict={dict} />
        </nav>

        {/* User controls */}
        <section className="user-controls-section flex items-center gap-4 sm:gap-6">
          {/* Desktop user controls */}
          <div className="hidden md:block">
            <UserButtonClient lang={currentLang} />
          </div>

          {/* Language and theme controls */}
          <LanguageSwitcher />
          <ModeToggle />

          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet>{/* Mobile menu content */}</Sheet>
          </div>
        </section>
      </div>
    </header>
  );
}
```

### 2. UserButtonClient Component

The `UserButtonClient` component is the core of the sign-in functionality. Here's the complete implementation:

```typescript
"use client";

import { useSession } from "next-auth/react";
import { signIn, signOut } from "next-auth/react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { LogIn, LogOut, User } from "lucide-react";
import Link from "next/link";

interface UserButtonClientProps {
  lang?: string;
}

export default function UserButtonClient({ lang = "en" }: UserButtonClientProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button variant="ghost" size="icon" className="animate-pulse">
        <User className="h-5 w-5" />
      </Button>
    );
  }

  if (session?.user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session.user.image || undefined} alt={session.user.name || "User"} />
              <AvatarFallback>
                {session.user.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/${lang}/user/profile`}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button variant="ghost" size="icon" onClick={() => signIn("google")}>
      <LogIn className="h-5 w-5" />
    </Button>
  );
}
```

## How It Works

1. **Component Integration**:

   - The `UserButtonClient` is rendered in the `Header` component
   - It's conditionally shown based on screen size (desktop/mobile)

2. **Authentication State**:

   - Uses `useSession` hook from `next-auth/react` to track authentication state
   - Shows different UI based on three states:
     - Loading: Shows a pulsing user icon
     - Authenticated: Shows user avatar with dropdown menu
     - Unauthenticated: Shows sign-in button

3. **Sign-in Flow**:

   - When unauthenticated, clicking the button triggers `signIn("google")`
   - This redirects to Google's OAuth flow
   - After successful authentication, the user is redirected back

4. **User Menu**:

   - When authenticated, shows a dropdown menu with:
     - User avatar (with fallback to initials)
     - Profile link
     - Sign out option

5. **Responsive Design**:
   - Desktop: Shows in the header's user controls section
   - Mobile: Integrated into the mobile menu sheet

## Key Features

- Seamless integration with NextAuth.js
- Responsive design for both desktop and mobile
- Loading state handling
- User avatar with fallback to initials
- Dropdown menu for authenticated users
- Direct sign-in with Google provider
- Clean and modern UI using shadcn/ui components
