# ICP Backend Undefined Error

## Problem

We're getting a runtime error when trying to call the ICP backend:

```
Uncaught TypeError: Cannot read properties of undefined (reading 'greet')
at handleSubmit (page.tsx:17:13)
```

## Current Setup

- **Import**: `import { backend } from "@/ic/declarations/backend";` ✅ Works (no module resolution errors)
- **Usage**: `backend.greet(name).then((greeting) => { ... });` ❌ Fails at runtime
- **Declarations exist**: `src/ic/declarations/backend/index.d.ts` contains the `backend` export

### Backend Object Flow

The `backend` object comes from the auto-generated declarations:

1. **`src/ic/declarations/backend/index.js`** - Runtime implementation. Important: `"@/ic/declarations/backend";` resolves to `"@/ic/declarations/backend/index.js";

   - Exports `backend` object (line 43)
   - Uses `process.env.CANISTER_ID_BACKEND` to create the actor
   - Returns `undefined` if canisterId is not available

2. **`src/ic/declarations/backend/index.d.ts`** - TypeScript definitions

   - Defines the `backend` type as `ActorSubclass<_SERVICE>`
   - Contains the `greet` method signature

3. **`src/ic/declarations/backend/backend.did.d.ts`** - Service interface
   - Defines `_SERVICE` with `greet: ActorMethod<[string], string>`

**Note**: The `backend` import resolves to `index.js` which exports the actual runtime object, not the TypeScript definitions.

## Root Cause Analysis

### The Issue

The `backend` import is resolving correctly (no TypeScript errors), but at runtime it's `undefined`. This suggests:

1. **Import succeeds** - TypeScript finds the module and types
2. **Runtime fails** - The actual `backend` object is undefined when accessed

### Possible Causes

1. **Environment Variables Missing**: The `backend` export depends on `process.env.CANISTER_ID_BACKEND` being available
2. **Build vs Runtime**: The declarations might be built for a different environment
3. **Module Resolution**: The import path works but the actual module content is empty/undefined

## Investigation Needed

1. **Check environment variables**: Is `NEXT_PUBLIC_CANISTER_ID_BACKEND` set?
2. **Check backend export**: What does `console.log(backend)` show?
3. **Check declarations**: Are the generated files complete?

## Current Status

- ✅ Module resolution working
- ✅ TypeScript compilation successful
- ❌ Runtime error - backend is undefined
- ❌ Need to investigate environment variables and module content

## Priority

High - The ICP integration is partially working but failing at runtime.
