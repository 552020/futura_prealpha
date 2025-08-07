# Component Architecture Analysis

## Overview

Futura uses a well-structured React component architecture built on **Next.js 15** with **App Router**. The component system is organized around feature domains, reusable UI components, and context-driven state management.

## Component Organization Structure

```
src/components/
├── ui/                     # Shadcn/ui base components
├── onboarding/            # Onboarding flow components
│   ├── steps/            # Individual step components
│   ├── hooks/            # Onboarding-specific hooks
│   ├── common/           # Shared onboarding components
│   └── onboard-modal.tsx # Main modal orchestrator
├── memory/               # Memory management components
├── utils/                # Component utilities
├── legacy/               # Deprecated components
└── [feature-components]   # Top-level feature components
```

## Core Architecture Patterns

### 1. Context-Driven State Management

#### OnboardingContext

```typescript
interface OnboardingContextType {
  // File management
  files: TempFile[];
  addFile: (file: TempFile) => void;
  removeFile: (url: string) => void;
  clearFiles: () => void;

  // Step navigation
  currentStep: OnboardingStep;
  setCurrentStep: (step: OnboardingStep) => void;

  // User data
  userData: UserData;
  updateUserData: (update: Partial<UserData>) => void;

  // Status tracking
  onboardingStatus: OnboardingStatus;
  setOnboardingStatus: (status: OnboardingStatus) => void;
}
```

**Features**:

- **Persistent state** via localStorage
- **File management** with URL cleanup
- **Step orchestration** for complex flows
- **Functional updates** for state mutations

#### InterfaceContext

```typescript
interface InterfaceContextType {
  mode: InterfaceMode; // "marketing" | "app"
  setMode: (mode: InterfaceMode) => void;
}
```

**Purpose**: Switches UI modes based on route patterns to show different interfaces for marketing vs. application pages.

### 2. Component Composition Patterns

#### Step-Based Components

The onboarding system uses a **step-based composition pattern**:

```typescript
// Main orchestrator
<OnboardModal>
  {currentStep === "user-info" && <UserInfoStep />}
  {currentStep === "share" && <ShareStep />}
  {currentStep === "sign-up" && <SignUpStep />}
</OnboardModal>

// Each step is self-contained
<UserInfoStep
  withImage={false}
  collectEmail={true}
  onNext={handleNext}
  onBack={handleBack}
  isReadOnly={status === "authenticated"}
/>
```

#### Hook-Based Logic Separation

```typescript
// Custom hook for navigation logic
export function useStepNavigation() {
  const { currentStep, setCurrentStep } = useOnboarding();
  const { status } = useSession();

  const steps = status === "authenticated" ? AUTHENTICATED_STEPS : UNAUTHENTICATED_STEPS;

  return {
    currentStep,
    canGoBack,
    canGoForward,
    goToNextStep,
    goToPreviousStep,
    goToStep,
  };
}
```

## Component Categories

### 1. UI Foundation (Shadcn/ui)

**Base Components** (19 components):

- `Button`, `Input`, `Textarea` - Form controls
- `Dialog`, `Sheet`, `Toast` - Overlays and notifications
- `Card`, `Table`, `Tabs` - Layout and organization
- `Avatar`, `Dropdown Menu`, `Navigation Menu` - User interface
- `Switch`, `Select`, `Label` - Form inputs
- `Accordion`, `Tooltip`, `Aspect Ratio` - Content presentation

**Characteristics**:

- **Radix UI primitives** for accessibility
- **Tailwind CSS** styling with CSS variables
- **Variant-based styling** using `class-variance-authority`
- **TypeScript interfaces** for prop safety

### 2. Layout Components

#### Header Component

```typescript
interface HeaderProps {
  dict: Dictionary;
  lang: string;
}

// Features:
// - Language-aware navigation
// - User authentication state
// - Logo with language routing
// - Responsive design
```

#### Navigation Components

- **Sidebar**: Desktop navigation with dictionary support
- **BottomNav**: Mobile navigation
- **NavBar**: Generic navigation component

### 3. Onboarding System

#### Step Components

```typescript
// User Info Collection
<UserInfoStep
  withImage={boolean}
  collectEmail={boolean}
  onNext={() => void}
  onBack={() => void}
  isReadOnly={boolean}
/>

// Memory Sharing
<ShareStep
  onNext={() => void}
  onBack={() => void}
/>

// Account Creation
<SignUpStep
  onBack={() => void}
/>
```

#### Common Components

- **StepContainer**: Consistent layout wrapper
- **StepNavigation**: Navigation controls
- **ImagePreview**: File preview functionality

#### Onboarding Flow Logic

```typescript
// Step sequences based on authentication
const UNAUTHENTICATED_STEPS = ["upload", "user-info", "share", "sign-up", "complete"];
const AUTHENTICATED_STEPS = ["upload", "share", "complete"];

// Dynamic step handling
const handleNext = async () => {
  switch (currentStep) {
    case "upload":
    // Handle file upload completion
    case "user-info":
    // Process user information
    case "share":
    // Handle sharing configuration
    case "sign-up":
    // Process account creation
  }
};
```

### 4. Memory Management Components

#### Memory Components (6 components):

- **MemoryCard**: Individual memory display
- **MemoryGrid**: Collection layout
- **MemoryViewer**: Detailed memory view
- **MemoryUpload**: File upload interface
- **MemoryActions**: Action buttons and controls
- **MemoryStatus**: Status indicators
- **ShareDialog**: Sharing configuration

```typescript
interface MemoryViewerProps {
  memory: Memory;
  isOwner: boolean;
  accessLevel: "read" | "write";
}
```

### 5. Feature Components

#### ValueJourney Component

```typescript
interface ValueJourneyProps {
  dict: Dictionary;
  lang: string;
  segment?: string; // Segment-specific content
}

// Features:
// - Dynamic scene loading based on segment
// - Internationalized content
// - Image path resolution
// - Fallback handling
```

**Segment Support**:

- `family`, `black-mirror`, `creatives`, `wedding`
- Dynamic image paths: `/images/segments/${journeyType}/scene_${sceneIndex}.webp`
- Dictionary-driven content with fallbacks

#### Hero Component

```typescript
interface HeroProps {
  dict: Dictionary;
  lang: string;
}

// Simple presentation component
// - Dictionary-driven content
// - Language-aware routing
// - Call-to-action buttons
```

## State Management Patterns

### 1. Context Providers Hierarchy

```tsx
<SessionProvider basePath="/api/auth">
  <PostHogProvider>
    <ThemeProvider>
      <InterfaceProvider>
        <OnboardingProvider>{children}</OnboardingProvider>
      </InterfaceProvider>
    </ThemeProvider>
  </PostHogProvider>
</SessionProvider>
```

### 2. Local State Patterns

- **useState** for component-specific state
- **useEffect** for side effects and lifecycle
- **useCallback** for memoized functions
- **Custom hooks** for reusable logic

### 3. Server State Integration

- **NextAuth.js** for authentication state
- **Server Components** for data fetching
- **Client Components** for interactivity

## Internationalization Integration

### Dictionary-Driven Components

```typescript
// Components receive dictionaries as props
interface ComponentProps {
  dict: Dictionary;
  lang?: string; // Only needed for navigation/routing
}

// Usage patterns
const dict = await getDictionary(lang, { segment });
<Hero dict={dict} lang={lang} />
<ValueJourney dict={dict} lang={lang} segment={segment} />
```

### Language Parameter Usage

**Components needing `lang` parameter**:

- **ValueJourney**: Image paths and fallbacks
- **Header**: Logo links and navigation
- **NavBar**: Route construction
- **ItemsUploadClient**: Navigation routing

**Components using only `dict`**:

- **Hero**: Content display only
- **BottomNav**: Static navigation
- **Sidebar**: Content display

## Component Communication Patterns

### 1. Props Down, Events Up

```typescript
// Parent orchestrates, children notify
<StepComponent onNext={handleNext} onBack={handleBack} data={stepData} />
```

### 2. Context for Shared State

```typescript
// Global state via context
const { files, addFile, removeFile } = useOnboarding();
const { mode } = useInterface();
```

### 3. Custom Hooks for Logic

```typescript
// Reusable logic extraction
const { canGoBack, canGoForward, goToNextStep } = useStepNavigation();
```

## Performance Considerations

### 1. Component Optimization

- **Client/Server component separation**
- **Dynamic imports** for large components
- **Memoization** with `useCallback` and `useMemo`
- **Proper dependency arrays** in hooks

### 2. State Management

- **Functional updates** to prevent unnecessary re-renders
- **Local state** preferred over global when possible
- **Context splitting** to minimize re-render scope

### 3. File Handling

- **Object URL cleanup** to prevent memory leaks
- **File validation** before processing
- **Progress indicators** for uploads

## Best Practices Observed

### ✅ Good Practices

- **Clear component boundaries** with well-defined interfaces
- **Separation of concerns** between UI and business logic
- **Consistent prop naming** and TypeScript interfaces
- **Error boundaries** and fallback handling
- **Accessibility** through Radix UI primitives
- **Responsive design** with Tailwind CSS

### 🔄 Areas for Consideration

- **Component size** - some components are quite large (onboard-modal.tsx: 230 lines)
- **Prop drilling** - could benefit from more context usage in some areas
- **Component testing** - no visible test files in component structure
- **Documentation** - components could benefit from JSDoc comments

This component architecture provides a solid foundation for Futura's complex user flows while maintaining maintainability and extensibility.
