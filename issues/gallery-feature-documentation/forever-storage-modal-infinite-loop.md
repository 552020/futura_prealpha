# ForeverStorageProgressModal Infinite Loop Issue

## Problem

The `ForeverStorageProgressModal` component is causing infinite loops and breaking the application. The modal is stuck in a re-render cycle that prevents normal operation.

## Root Cause

The infinite loop is caused by incorrect `useEffect` dependency arrays in the modal component:

```typescript
// Auto-start the process when modal opens
useEffect(() => {
  if (isOpen && currentStep === "idle") {
    handleStartStorage();
  }
}, [isOpen, currentStep, handleStartStorage]); // ❌ handleStartStorage causes infinite loop

// If user returns with II linked while modal is at auth, auto-resume
useEffect(() => {
  if (isOpen && currentStep === "auth" && hasIIPrincipal && !authResumedRef.current) {
    authResumedRef.current = true;
    handleStartStorage();
  }
}, [isOpen, currentStep, hasIIPrincipal, handleStartStorage]); // ❌ handleStartStorage causes infinite loop
```

## Why It's Broken

1. `handleStartStorage` is wrapped in `useCallback` with dependencies that change on every render
2. When `handleStartStorage` changes, it triggers the `useEffect` again
3. The `useEffect` calls `handleStartStorage`, which changes state
4. State change causes re-render, which recreates `handleStartStorage`
5. This creates an infinite loop

## Current State

- Modal opens but gets stuck in infinite re-render cycle
- Application becomes unresponsive
- Console shows continuous re-renders
- User cannot interact with the modal or close it

## Affected Files

- `src/nextjs/src/components/galleries/ForeverStorageProgressModal.tsx`

## Proposed Fix

Remove `handleStartStorage` from the dependency arrays since the effects only need to run when their specific conditions change:

```typescript
// Auto-start the process when modal opens
useEffect(() => {
  if (isOpen && currentStep === "idle") {
    handleStartStorage();
  }
}, [isOpen, currentStep]); // ✅ Remove handleStartStorage

// If user returns with II linked while modal is at auth, auto-resume
useEffect(() => {
  if (isOpen && currentStep === "auth" && hasIIPrincipal && !authResumedRef.current) {
    authResumedRef.current = true;
    handleStartStorage();
  }
}, [isOpen, currentStep, hasIIPrincipal]); // ✅ Remove handleStartStorage
```

## Priority

**Critical** - This completely breaks the "Store Forever" functionality and makes the application unusable when the modal is triggered.

## Testing Needed

- [ ] Verify modal opens without infinite loop
- [ ] Test the complete II authentication flow
- [ ] Ensure modal can be closed properly
- [ ] Check that storage process completes successfully
