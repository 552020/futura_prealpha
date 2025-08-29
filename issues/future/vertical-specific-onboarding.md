# Vertical-Specific Onboarding Flow

## Problem

Currently, all verticals use the same onboarding flow that leads to the vault. For the wedding/forever-gallery vertical, we need a different flow that leads to a gallery instead.

## Current State

- **Family vertical**: Upload → Onboarding → Vault
- **Wedding vertical**: Upload → Onboarding → Vault (wrong!)
- **All verticals**: Same flow, same destination

## Proposed Solution

### 1. Create Vertical Context

```typescript
// src/contexts/vertical-context.tsx
type VerticalType = "family" | "wedding" | "creative" | "black-mirror";

interface VerticalContextType {
  vertical: VerticalType;
  setVertical: (vertical: VerticalType) => void;
  getOnboardingDestination: () => string; // Returns route based on vertical
  getUploadSuccessAction: () => "onboarding" | "gallery" | "vault";
}
```

### 2. Vertical-Specific Destinations

```typescript
const VERTICAL_CONFIGS = {
  family: {
    uploadSuccessAction: "onboarding",
    onboardingDestination: "/vault",
    flow: "upload → onboarding → vault",
  },
  wedding: {
    uploadSuccessAction: "gallery",
    onboardingDestination: "/gallery",
    flow: "upload → gallery (immediate value)",
  },
  creative: {
    uploadSuccessAction: "onboarding",
    onboardingDestination: "/studio",
    flow: "upload → onboarding → studio",
  },
};
```

### 3. Dynamic Upload Success Handling

```typescript
// In items-upload-client.tsx
const handleUploadSuccess = () => {
  const { getUploadSuccessAction, getOnboardingDestination } = useVertical();

  switch (getUploadSuccessAction()) {
    case "onboarding":
      setShowOnboardModal(true);
      break;
    case "gallery":
      router.push(getOnboardingDestination());
      break;
    case "vault":
      router.push(getOnboardingDestination());
      break;
  }
};
```

### 4. Update Onboarding Context

```typescript
// Extend onboarding context to be vertical-aware
interface OnboardingContextType {
  // ... existing properties
  vertical: VerticalType;
  getDestination: () => string;
}
```

## Implementation Plan

### Phase 1: Vertical Context

1. Create `VerticalContext` with vertical detection
2. Add vertical-specific configurations
3. Update `InterfaceContext` to work with verticals

### Phase 2: Dynamic Routing

1. Update `items-upload-client.tsx` to use vertical context
2. Modify `handleUploadSuccess` to route based on vertical
3. Update `OnboardModal` completion to use vertical destination

### Phase 3: Gallery Implementation

1. Create `/gallery` route for wedding vertical
2. Implement gallery-specific features
3. Add gallery navigation and layout

### Phase 4: Testing & Refinement

1. Test family vertical still works
2. Test wedding vertical goes to gallery
3. Ensure smooth transitions

## Benefits

- ✅ **Immediate value** for wedding users (gallery)
- ✅ **Flexible architecture** for future verticals
- ✅ **Maintains existing flows** for family vertical
- ✅ **Context-driven routing** instead of hardcoded paths

## Questions to Resolve

1. Should gallery be a separate route or a vault variation?
2. How do we handle the onboarding modal for wedding users?
3. What's the difference between gallery and vault UI?
4. Should we keep the sharing flow for wedding users?

## Files to Modify

- `src/contexts/vertical-context.tsx` (new)
- `src/contexts/onboarding-context.tsx` (extend)
- `src/app/[lang]/onboarding/items-upload/items-upload-client.tsx`
- `src/components/onboarding/onboard-modal.tsx`
- `src/app/[lang]/gallery/page.tsx` (new)
- `src/app/[lang]/gallery/layout.tsx` (new)
