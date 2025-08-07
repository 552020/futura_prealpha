# Task 01: File-Based Routing → React Router

## 🎯 **Objective**

Replace Next.js App Router file-based routing with React Router for the ICP build, while keeping the existing Next.js routing for the Vercel build.

## 📋 **Current State (Next.js App Router)**

### **File Structure:**

```
src/app/
├── [lang]/
│   ├── page.tsx                    // Homepage
│   ├── layout.tsx                  // Root layout
│   ├── loading.tsx                 // Loading UI
│   ├── about/
│   │   └── page.tsx               // About page
│   ├── memories/
│   │   ├── page.tsx               // Memories listing
│   │   ├── [id]/
│   │   │   └── page.tsx           // Individual memory
│   │   └── upload/
│   │       └── page.tsx           // Upload memory
│   └── settings/
│       └── page.tsx               // User settings
└── api/                           // API routes (will be removed)
```

### **Current Routing Features:**

- **Dynamic routes**: `[lang]`, `[id]` parameters
- **Nested layouts**: Automatic layout nesting
- **Loading states**: `loading.tsx` files
- **Automatic code splitting**: Per-route bundles
- **Locale-based routing**: `/en/`, `/fr/`, etc.

## 🔧 **Target State (React Router)**

### **New Structure:**

```
src/
├── components/                    // Shared components
├── pages/                        // Page components (extracted from app/)
│   ├── HomePage.tsx
│   ├── AboutPage.tsx
│   ├── MemoriesPage.tsx
│   ├── MemoryDetailPage.tsx
│   ├── UploadPage.tsx
│   └── SettingsPage.tsx
├── layouts/                      // Layout components
│   └── RootLayout.tsx
├── router/                       // Router configuration
│   ├── AppRouter.tsx            // Main router component
│   └── routes.tsx               // Route definitions
└── icp/                         // ICP build entry point
    └── main.tsx                 // App entry for ICP
```

## 🛠️ **Implementation Steps**

### **Step 1: Extract Page Components**

```typescript
// pages/HomePage.tsx
import { useParams } from "react-router-dom";

export default function HomePage() {
  const { lang } = useParams<{ lang: string }>();

  // Move logic from src/app/[lang]/page.tsx
  return <main className="bg-white dark:bg-[#0A0A0B]">{/* Existing homepage content */}</main>;
}
```

### **Step 2: Create Router Configuration**

```typescript
// router/routes.tsx
import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";
import HomePage from "../pages/HomePage";
import AboutPage from "../pages/AboutPage";
import MemoriesPage from "../pages/MemoriesPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        path: ":lang",
        children: [
          {
            index: true,
            element: <HomePage />,
          },
          {
            path: "about",
            element: <AboutPage />,
          },
          {
            path: "memories",
            children: [
              {
                index: true,
                element: <MemoriesPage />,
              },
              {
                path: ":id",
                element: <MemoryDetailPage />,
              },
              {
                path: "upload",
                element: <UploadPage />,
              },
            ],
          },
          {
            path: "settings",
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },
]);
```

### **Step 3: Create Root Layout**

```typescript
// layouts/RootLayout.tsx
import { Outlet, useParams } from "react-router-dom";
import { useEffect } from "react";

export default function RootLayout() {
  const { lang } = useParams<{ lang: string }>();

  useEffect(() => {
    // Handle locale changes
    document.documentElement.lang = lang || "en";
  }, [lang]);

  return (
    <html lang={lang || "en"}>
      <body>
        <div id="root">
          <Outlet />
        </div>
      </body>
    </html>
  );
}
```

### **Step 4: Set Up ICP Entry Point**

```typescript
// icp/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "../router/routes";
import "../globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
```

### **Step 5: Build-Time Conditional Routing**

```typescript
// App.tsx (shared entry point)
import { BUILD_TARGET } from "./config";

function App() {
  if (BUILD_TARGET === "nextjs") {
    // Next.js handles routing automatically
    return null; // Not used in Next.js build
  }

  // ICP build uses React Router
  return <RouterProvider router={router} />;
}
```

## 🔄 **Dual-Build Integration**

### **Shared Components:**

- Keep all page components in `pages/` folder
- Use conditional imports for routing logic
- Maintain identical UI across both builds

### **Build Configuration:**

```typescript
// vite.config.ts (ICP build)
export default {
  build: {
    rollupOptions: {
      input: "src/icp/main.tsx",
      external: ["next/router", "next/navigation"], // Exclude Next.js routing
    },
  },
};

// next.config.js (Vercel build)
export default {
  // Keep existing Next.js App Router configuration
};
```

## ⚠️ **Challenges & Solutions**

### **Challenge 1: Dynamic Route Parameters**

**Problem**: Next.js `[lang]` vs React Router `:lang`

**Solution**:

```typescript
// Shared parameter extraction
function useRouteParams() {
  if (BUILD_TARGET === "nextjs") {
    const params = useParams(); // Next.js hook
    return params;
  } else {
    const params = useParams(); // React Router hook
    return params;
  }
}
```

### **Challenge 2: Locale Handling**

**Problem**: Next.js middleware vs client-side detection

**Solution**:

```typescript
// Client-side locale detection for ICP
function useLocaleDetection() {
  const navigate = useNavigate();
  const { lang } = useParams();

  useEffect(() => {
    if (!lang) {
      const detectedLang = navigator.language.split("-")[0];
      const supportedLang = ["en", "fr", "es"].includes(detectedLang) ? detectedLang : "en";
      navigate(`/${supportedLang}`, { replace: true });
    }
  }, [lang, navigate]);
}
```

### **Challenge 3: Code Splitting**

**Problem**: Next.js automatic splitting vs manual React Router splitting

**Solution**:

```typescript
// Lazy load pages for React Router
const HomePage = lazy(() => import('../pages/HomePage'));
const AboutPage = lazy(() => import('../pages/AboutPage'));

// Wrap with Suspense
{
  path: ':lang',
  element: (
    <Suspense fallback={<LoadingSpinner />}>
      <Outlet />
    </Suspense>
  ),
  children: [
    {
      index: true,
      element: <HomePage />
    }
  ]
}
```

## ✅ **Success Criteria**

- [ ] All existing routes work identically on both builds
- [ ] Dynamic parameters (`[lang]`, `[id]`) function correctly
- [ ] Client-side navigation works smoothly
- [ ] Code splitting maintains performance
- [ ] Locale detection works on ICP build
- [ ] No broken links or navigation issues
- [ ] Build outputs are clean (no Next.js router imports in ICP build)

## 🧪 **Testing Checklist**

- [ ] Test all routes manually on both builds
- [ ] Verify dynamic route parameters work
- [ ] Test browser back/forward navigation
- [ ] Check locale switching functionality
- [ ] Verify code splitting is working (network tab)
- [ ] Test deep linking (direct URL access)
- [ ] Ensure no console errors related to routing

## 📝 **Notes**

- This task focuses on **routing mechanism only** - page content remains identical
- **No backend calls** needed - this is purely frontend routing
- **Maintain exact same user experience** across both builds
- **Start simple** - get basic routing working before adding advanced features
