# dfx generate env_override generates string literal instead of environment variable reference

## Issue Description

When using the `env_override` field in dfx.json declarations configuration, the generated code contains a string literal instead of a proper JavaScript environment variable reference.

## Expected Behavior

According to the [dfx generate documentation](https://internetcomputer.org/docs/building-apps/developer-tools/dfx/dfx-generate), the `env_override` field should replace `process.env.CANISTER_ID_{canister_name_uppercase}` in the template with the specified string.

**Expected generated code:**

```javascript
export const canisterId = process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND;
```

## Actual Behavior

**Actual generated code:**

```javascript
export const canisterId = "process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND";
```

## Configuration Used

```json
{
  "canisters": {
    "backend": {
      "declarations": {
        "output": "src/nextjs/src/ic/declarations/backend",
        "env_override": "process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND"
      }
    }
  }
}
```

## Impact

This bug prevents the generated TypeScript declarations from properly resolving canister IDs at runtime, causing ICP calls to fail because `canisterId` evaluates to a literal string instead of the actual environment variable value.

## Environment

- dfx version: 0.29.0
- Project type: Next.js with ICP integration
- Target: Browser environment requiring NEXT*PUBLIC* prefix

## Steps to Reproduce

1. Configure dfx.json with `env_override` field
2. Run `dfx generate`
3. Check generated `index.js` file
4. Observe string literal instead of environment variable reference

## Workaround

Currently, the generated code needs to be manually edited to remove the quotes around the environment variable reference.
