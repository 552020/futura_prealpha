# ICP Deployment Considerations

## Overview

This document evaluates whether deploying Futura's frontend to the **Internet Computer Protocol (ICP)** would necessitate migrating from Next.js to vanilla React, and analyzes the implications of such a requirement.

## ICP Deployment Context

### What is ICP Frontend Hosting?

- **Decentralized hosting** on Internet Computer canisters
- **Static asset serving** from blockchain infrastructure
- **No traditional server-side execution** environment
- **Immutable deployments** with content addressing

### ICP Compatibility Requirements

```typescript
// ICP expects static frontend bundles
// Similar to traditional SPA deployment models
```

## Next.js on ICP: Compatibility Analysis

### ❌ **Incompatible Next.js Features**

#### 1. **Server-Side Rendering (SSR)**

```typescript
// This CANNOT run on ICP
export default async function LangPage({ params }: PageProps) {
  const dict = await getDictionary(params.lang); // Server-side execution
  return <Component dict={dict} />;
}
```

**Issue**: ICP canisters don't support traditional server-side rendering.

#### 2. **API Routes**

```typescript
// This CANNOT run on ICP frontend canisters
export async function GET(request: NextRequest) {
  const memories = await db.query.images.findMany(); // Database access
  return NextResponse.json({ memories });
}
```

**Issue**: Frontend canisters can't host API endpoints or connect to databases.

#### 3. **Middleware**

```typescript
// This CANNOT run on ICP
export function middleware(request: NextRequest) {
  const locale = getLocale(request); // Server-side logic
  return NextResponse.redirect(new URL(`/${locale}`, request.url));
}
```

**Issue**: No request interception capabilities in static hosting.

### ✅ **Compatible Next.js Features**

#### 1. **Static Site Generation (SSG)**

```typescript
// This CAN work on ICP if pre-rendered
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}
```

#### 2. **Client Components**

```typescript
// This works fine on ICP
"use client";
export function InteractiveComponent() {
  const [state, setState] = useState();
  return <UI />;
}
```

## ICP Deployment Scenarios

### Scenario A: **Full Migration Required** 🔴

If ICP requires **pure static hosting**:

#### What Must Change:

```typescript
// FROM: Next.js hybrid approach
export default async function Page({ params }) {
  const data = await fetchServerData(); // ❌ Not possible
  return <Component data={data} />;
}

// TO: Pure client-side React
function Page() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchFromBackendCanister().then(setData); // ✅ Client-side only
  }, []);

  return data ? <Component data={data} /> : <Loading />;
}
```

#### Migration Requirements:

- **Remove all server components** → Client components with data fetching
- **Extract API routes** → Separate backend canisters
- **Replace middleware** → Client-side routing logic
- **Convert SSR to SPA** → Lose SEO benefits

### Scenario B: **Hybrid Architecture** 🟡

#### Frontend: ICP Static Hosting

```typescript
// Pure React SPA deployed to ICP
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/:lang" element={<HomePage />} />
        <Route path="/:lang/vault" element={<VaultPage />} />
      </Routes>
    </Router>
  );
}
```

#### Backend: Separate ICP Canisters

```rust
// Backend canisters in Rust/Motoko
#[ic_cdk::query]
fn get_memories(user_id: String) -> Vec<Memory> {
    // Database logic in canister
}
```

## Impact Assessment

### 🔴 **If Vanilla React Migration is Required**

#### Technical Impact:

- **Apply all changes from Document 07** (vanilla React migration)
- **Additional ICP-specific constraints**:
  - No server-side rendering
  - Limited bundle size (canister limits)
  - Immutable deployments

#### Architecture Changes:

```typescript
// Current: Unified Next.js application
src/app/
├── [lang]/page.tsx        // ❌ Server component
├── api/memories/route.ts  // ❌ API routes
└── middleware.ts          // ❌ Server middleware

// Required: Split architecture
frontend-canister/
├── src/
│   ├── components/        // ✅ Client components only
│   ├── pages/            // ✅ React Router pages
│   └── utils/            // ✅ Client-side utilities
└── dist/                 // ✅ Static bundle

backend-canister/
├── src/main.rs           // ✅ Rust backend
└── memories.rs           // ✅ Database logic
```

### 🟡 **Mitigation Strategies**

#### 1. **Pre-build Optimization**

```typescript
// Generate static dictionaries at build time
const buildTimeDict = generateAllDictionaries();
// Embed in bundle instead of server-side loading
```

#### 2. **Client-Side Internationalization**

```typescript
// Replace middleware with client-side routing
function App() {
  const [currentLang, setCurrentLang] = useState(detectBrowserLanguage());

  useEffect(() => {
    // Client-side language routing
    if (!window.location.pathname.includes(currentLang)) {
      window.location.pathname = `/${currentLang}${window.location.pathname}`;
    }
  }, [currentLang]);
}
```

#### 3. **Backend Canister Integration**

```typescript
// Replace API routes with canister calls
import { Actor, HttpAgent } from "@dfinity/agent";

const agent = new HttpAgent();
const backendActor = Actor.createActor(backendIdl, {
  agent,
  canisterId: "backend-canister-id",
});

async function getMemories() {
  return await backendActor.get_memories();
}
```

## Recommendation

### If ICP Deployment is Required:

#### ✅ **YES, Vanilla React Migration Becomes Necessary**

**Reasoning**:

1. **ICP's static hosting model** eliminates Next.js server-side features
2. **No server-side rendering** capability in ICP frontend canisters
3. **API routes must move** to separate backend canisters
4. **Middleware functionality** must be client-side

#### Migration Becomes **MANDATORY** Not Optional

### Timeline Impact:

- **Add 2-4 weeks** to Document 07 timeline for ICP-specific adaptations
- **Total migration time**: 4-5 months
- **Additional complexity**: Backend canister development in Rust/Motoko

### Alternative: **Reconsider ICP for Frontend**

- **Keep Next.js** deployed on traditional infrastructure (Vercel/Netlify)
- **Use ICP only for backend** services (decentralized data storage)
- **Maintain performance and SEO benefits** of current architecture

## Conclusion

**If ICP frontend deployment is a hard requirement**, then **vanilla React migration becomes unavoidable**. However, this significantly increases the complexity and timeline outlined in Document 07.

**Recommendation**: Evaluate if ICP benefits justify the substantial development cost, or if a hybrid approach (traditional frontend + ICP backend) would be more practical.
