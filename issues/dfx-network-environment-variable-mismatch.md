# Issue: DFX_NETWORK Environment Variable Mismatch

## Problem

The auto-generated ICP declarations use `process.env.DFX_NETWORK` but our Next.js configuration only provides `process.env.NEXT_PUBLIC_DFX_NETWORK`.

## Affected Files

- `src/ic/declarations/backend/index.js` (line 22)
- `src/ic/declarations/internet_identity/index.js` (line 22)
- `src/ic/declarations/frontend/index.js` (line 22)

## Current Code

```javascript
// Fetch root key for certificate validation during development
if (process.env.DFX_NETWORK !== "ic") {
  agent.fetchRootKey().catch((err) => {
    console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
    console.error(err);
  });
}
```

## Issue

The auto-generated declarations expect the original `DFX_NETWORK` environment variable, but our Next.js config only exposes `NEXT_PUBLIC_DFX_NETWORK`.

## Why We Need NEXT*PUBLIC* for DFX_NETWORK

In Next.js, environment variables are only available in the browser (client-side) if they are prefixed with `NEXT_PUBLIC_`. The `DFX_NETWORK` variable is used in the auto-generated declarations to determine whether to fetch the root key for certificate validation during development:

```javascript
// Fetch root key for certificate validation during development
if (process.env.DFX_NETWORK !== "ic") {
  agent.fetchRootKey().catch((err) => {
    console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
    console.error(err);
  });
}
```

This code runs in the browser when the ICP agent is initialized, so it needs access to the `DFX_NETWORK` environment variable. Without the `NEXT_PUBLIC_` prefix, this variable would be `undefined` in the browser, causing the condition to always be true and potentially causing issues with certificate validation.

## Solutions to Consider

1. **Modify next.config.ts** to provide both original and NEXT*PUBLIC* versions
2. **Manually fix the declarations** (temporary solution) - replace `process.env.DFX_NETWORK` with `process.env.NEXT_PUBLIC_DFX_NETWORK`
3. **Use a build script** to transform the declarations after generation

## Documentation Research

According to the DFX documentation, there is **no built-in way** to prefix `DFX_NETWORK` with `NEXT_PUBLIC_` using the `env_override` field or any other dfx.json configuration. The `env_override` option is specifically documented as replacing the canister ID environment variable in the generated code, not for general environment variables like `DFX_NETWORK`.

## Status

- [ ] Fixed in next.config.ts
- [ ] Fixed in dfx.json configuration
- [ ] Manually patched declarations
