# Implement deploy script with declaration fixes

## Issue Description

The current deploy script needs to be extended to fix the `env_override` bug in dfx generate. The generated declarations contain string literals instead of proper environment variable references.

## Current Problem

After `dfx generate`, the declarations contain:

```javascript
export const canisterId = "process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND";
```

Instead of:

```javascript
export const canisterId = process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND;
```

## Process.env Occurrences Overview

Found **6 total occurrences** of `process.env` in the generated declarations:

### 📝 Comments (3 occurrences) - No action needed

- **Line 9** in all three files: `* process.env.CANISTER_ID_<CANISTER_NAME_UPPERCASE>`

### 🔧 String Literals (3 occurrences) - Need fixing

- **Line 13** in `backend/index.js`: `"process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND";` → `process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND;`
- **Line 13** in `frontend/index.js`: `"process.env.NEXT_PUBLIC_CANISTER_ID_FRONTEND";` → `process.env.NEXT_PUBLIC_CANISTER_ID_FRONTEND;`
- **Line 13** in `internet_identity/index.js`: `"process.env.NEXT_PUBLIC_CANISTER_ID_INTERNET_IDENTITY";` → `process.env.NEXT_PUBLIC_CANISTER_ID_INTERNET_IDENTITY;`

### ⚠️ Missing NEXT_PUBLIC (3 occurrences) - Need fixing

**Current pattern:**

```javascript
// Fetch root key for certificate validation during development
if (process.env.DFX_NETWORK !== "ic") {
  agent.fetchRootKey().catch((err) => {
    console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
    console.error(err);
  });
}
```

- **Line 25** in all three files: `process.env.DFX_NETWORK` → `process.env.NEXT_PUBLIC_DFX_NETWORK`

## Solution

Extend the deploy script to include a post-processing step that:

1. Runs `dfx generate`
2. Fixes the string literals in all three index.js files
3. Removes the quotes around the environment variable references

## Implementation Strategies

### Problem 1: String Literals (Line 13)

**Current pattern:**

```javascript
export const canisterId = "process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND";
```

#### Strategy A: Regex-based (Current)

```bash
# Simple sed replacement
sed -i '' 's/"process\.env\.NEXT_PUBLIC_CANISTER_ID_BACKEND"/process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND/g'
```

**Pros:** Simple, fast
**Cons:** Fragile to whitespace changes, exact string matching

#### Strategy B: Multi-line Regex

```bash
# Handle multi-line patterns
sed -i '' '/export const canisterId =/,/;/ s/"process\.env\.NEXT_PUBLIC_CANISTER_ID_[^"]*"/process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND/g'
```

**Pros:** More robust to formatting changes
**Cons:** Still regex-based, complex

#### Strategy C: Robust Bash Script (Recommended)

```bash
#!/bin/bash

# Fix declarations in all canister files
fix_declarations() {
    local canister_name=$1
    local file_path="src/nextjs/src/ic/declarations/${canister_name}/index.js"

    echo "🔧 Fixing ${canister_name} declarations..."

    # Fix string literals - handle multi-line and single-line patterns
    sed -i '' \
        -e '/export const canisterId/,/;/ s/"process\.env\.NEXT_PUBLIC_CANISTER_ID_[^"]*"/process.env.NEXT_PUBLIC_CANISTER_ID_'"${canister_name^^}"'/g' \
        -e 's/process\.env\.DFX_NETWORK/process.env.NEXT_PUBLIC_DFX_NETWORK/g' \
        "$file_path"
}

# Apply fixes to all canisters
for canister in backend frontend internet_identity; do
    fix_declarations "$canister"
done
```

**Pros:** Pure bash, maintainable, handles edge cases, readable
**Cons:** Still regex-based but more robust than simple sed

### Problem 2: Missing NEXT_PUBLIC (Line 25)

**Current pattern:**

```javascript
export const network = process.env.DFX_NETWORK;
```

#### Strategy A: Simple sed replacement

```bash
sed -i '' 's/process\.env\.DFX_NETWORK/process.env.NEXT_PUBLIC_DFX_NETWORK/g'
```

#### Strategy B: Bash Function (Recommended)

```bash
# Same bash function as above, already includes both fixes
```

## Recommended Implementation

Use **Strategy C (Robust Bash Script)** for both problems:

```bash
# Fix both issues in one script
echo -e "${YELLOW}🔧 Fixing declaration issues...${NC}"

# Fix declarations in all canister files
fix_declarations() {
    local canister_name=$1
    local file_path="src/nextjs/src/ic/declarations/${canister_name}/index.js"

    echo "🔧 Fixing ${canister_name} declarations..."

    # Fix string literals - handle multi-line and single-line patterns
    sed -i '' \
        -e '/export const canisterId/,/;/ s/"process\.env\.NEXT_PUBLIC_CANISTER_ID_[^"]*"/process.env.NEXT_PUBLIC_CANISTER_ID_'"${canister_name^^}"'/g' \
        -e 's/process\.env\.DFX_NETWORK/process.env.NEXT_PUBLIC_DFX_NETWORK/g' \
        "$file_path"
}

# Apply fixes to all canisters
for canister in backend frontend internet_identity; do
    fix_declarations "$canister"
done
```

## Workflow

1. Run `./scripts/deploy.sh`
2. Script deploys canisters
3. Script generates declarations
4. Script fixes string literals
5. ICP integration works correctly
