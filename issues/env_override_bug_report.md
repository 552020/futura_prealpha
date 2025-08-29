# Bug Report: `env_override` generates string literal instead of environment variable reference

## Issue Summary

When using the `env_override` field in dfx.json declarations configuration, the generated code contains a string literal instead of a proper JavaScript environment variable reference, causing runtime failures in frontend applications.

## Problem Description

### Expected Behavior

According to the [dfx generate documentation](https://internetcomputer.org/docs/building-apps/developer-tools/dfx/dfx-generate), the `env_override` field should replace `process.env.CANISTER_ID_{canister_name_uppercase}` in the template with the specified string.

**Expected generated code:**

```javascript
export const canisterId = process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND;
```

### Actual Behavior

**Actual generated code:**

```javascript
export const canisterId = "process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND";
```

## Root Cause Analysis

### 1. Configuration Flow

The issue originates in the configuration parsing and flows through the following components:

#### Configuration Definition

**File**: `src/dfx-core/src/config/model/dfinity.rs` (lines 541-542)

```rust
/// # Canister ID ENV Override
/// A string that will replace process.env.CANISTER_ID_{canister_name_uppercase}
/// in the 'src/dfx/assets/language_bindings/canister.js' template.
pub env_override: Option<String>,
```

#### Configuration Processing

**File**: `src/dfx/src/lib/canister_info.rs` (lines 125-135)

```rust
// Fill the default config values if None provided
let declarations_config = CanisterDeclarationsConfig {
    output: declarations_config_pre
        .output
        .or_else(|| Some(workspace_root.join("src/declarations").join(name))),
    bindings: declarations_config_pre
        .bindings
        .or_else(|| Some(vec!["js".to_string(), "ts".to_string(), "did".to_string()])),
    env_override: declarations_config_pre.env_override,  // Passed through as-is
    node_compatibility: declarations_config_pre.node_compatibility,
};
```

### 2. Template Processing

#### Template File

**File**: `src/dfx/assets/language_bindings/canister.js` (line 8)

```javascript
// CANISTER_ID is replaced by webpack based on node environment
export const canisterId = process.env.CANISTER_ID_{canister_name_ident_uppercase};
```

#### Template Rendering Logic

**File**: `src/dfx/src/lib/builders/mod.rs` (lines 298-310)

```rust
// Switches to prefixing the canister id with the env variable for frontend declarations as new default
let process_string_prefix: String = match &info.get_declarations_config().env_override {
    Some(s) => format!(r#""{}""#, s.clone()),  // ❌ BUG: Wraps value in quotes
    None => {
        format!(
            "process.env.{}{}",
            "CANISTER_ID_",
            &canister_name_ident.to_ascii_uppercase(),
        )
    }
};

data.insert(
    "canister_name_process_env".to_string(),
    &process_string_prefix,
);
```

### 3. The Bug

The bug is in line 301 of `src/dfx/src/lib/builders/mod.rs`:

```rust
Some(s) => format!(r#""{}""#, s.clone()),  // ❌ BUG: Adds quotes around the value
```

This line uses the raw string literal `r#""{}""#` which produces:

- Input: `"process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND"`
- Output: `"process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND"` (quoted string)

Instead of:

- Input: `"process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND"`
- Expected Output: `process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND` (unquoted)

## Root Cause Analysis: Context Misunderstanding

The bug was caused by **misunderstanding the context** of the `r#""{}""#` pattern:

### Correct Usage Pattern

The `r#""{}""#` pattern is correct when generating **quoted strings** for contexts like JSON:

**Example from `src/canisters/frontend/ic-asset/src/security_policy.rs` (line 57):**

```rust
let header_line = format!(r#""{name}": "{content}""#);
// Output: "Content-Security-Policy": "default-src 'self';..."
```

This is correct because JSON requires quoted strings for both keys and values.

### Incorrect Usage (The Bug)

The same pattern was incorrectly used for **JavaScript template substitution**:

```rust
Some(s) => format!(r#""{}""#, s.clone()),  // ❌ WRONG: Generates quoted string
// Output: "process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND" (quoted string)
```

This is incorrect because JavaScript expressions should be unquoted:

```javascript
// Wrong (generated): "process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND"
// Correct (expected): process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND
```

### Comparison with Working Case

The `None` case demonstrates the correct pattern:

```rust
None => {
    format!(
        "process.env.{}{}",
        "CANISTER_ID_",
        &canister_name_ident.to_ascii_uppercase(),
    )
}
// Output: process.env.CANISTER_ID_BACKEND (unquoted expression)
```

This produces unquoted JavaScript expressions, which is what the template expects.

### The Pattern Rule

- **Use `r#""{}""#`** when generating **quoted strings** (JSON, string literals)
- **Use `format!()` without quotes** when generating **unquoted expressions** (JavaScript template substitution)

### Likely Development Context

The bug likely occurred when a developer was implementing the `env_override` feature and:

1. **Saw the `format!()` pattern** in the `None` case of the same match statement
2. **Tried to apply a similar pattern** to the `Some(s)` case
3. **Incorrectly added quotes** thinking they needed to format the string value

Looking at the code structure:

```rust
let process_string_prefix: String = match &info.get_declarations_config().env_override {
    Some(s) => format!(r#""{}""#, s.clone()),  // ❌ WRONG: Added quotes
    None => {
        format!(                           // ✅ CORRECT: No quotes
            "process.env.{}{}",
            "CANISTER_ID_",
            &canister_name_ident.to_ascii_uppercase(),
        )
    }
};
```

The developer probably thought: _"I need to format a string value, I see `format!()` is used in the `None` case, let me use `format!()` here too"_ but then incorrectly added quotes around the value.

This is a common pattern in software development where developers:

- **Copy patterns** they see in the same function
- **Apply them to similar-looking problems** without fully understanding the context
- **Miss the subtle difference** between "generate an unquoted expression" vs "use the value directly"

## Impact

### Runtime Failure

The generated code fails at runtime because:

1. `canisterId` evaluates to the literal string `"process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND"`
2. The ICP agent receives a string instead of the actual canister ID
3. All ICP calls fail with invalid canister ID errors

### Frontend Framework Issues

- **Next.js**: Requires `NEXT_PUBLIC_` prefixed environment variables for client-side access
- **Vite**: Requires `VITE_` prefixed environment variables
- **Create React App**: Requires `REACT_APP_` prefixed environment variables

### Workaround Required

Currently, developers must manually edit the generated files to remove quotes:

```javascript
// Generated (broken)
export const canisterId = "process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND";

// Manually fixed
export const canisterId = process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND;
```

## Configuration Examples

### Working Configuration (dfx.json)

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

### Environment Variables (.env.local)

```bash
NEXT_PUBLIC_CANISTER_ID_BACKEND=rrkah-fqaaa-aaaaa-aaaaq-cai
```

## Proposed Fix

### Code Change

**File**: `src/dfx/src/lib/builders/mod.rs` (line 301)

**Current (broken):**

```rust
Some(s) => format!(r#""{}""#, s.clone()),
```

**Proposed (fixed):**

```rust
Some(s) => s.clone(),
```

**Alternative using format!():**

```rust
Some(s) => format!("{}", s),
```

Both approaches produce the same result:

- `s.clone()` - Directly uses the string value
- `format!("{}", s)` - Formats the string without quotes

The `format!("{}", s)` approach is actually more consistent with the `None` case since both use `format!()`, but `s.clone()` is simpler and more direct.

### Complete Fixed Function

```rust
// Switches to prefixing the canister id with the env variable for frontend declarations as new default
let process_string_prefix: String = match &info.get_declarations_config().env_override {
    Some(s) => s.clone(),  // ✅ FIXED: Use value directly without quotes
    None => {
        format!(
            "process.env.{}{}",
            "CANISTER_ID_",
            &canister_name_ident.to_ascii_uppercase(),
        )
    }
};
```

## Testing Recommendations

### Unit Test

```rust
#[test]
fn test_env_override_generation() {
    let config = CanisterDeclarationsConfig {
        env_override: Some("process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND".to_string()),
        // ... other fields
    };

    let result = generate_process_string_prefix(&config, "backend");
    assert_eq!(result, "process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND");
}
```

### Integration Test

```bash
@test "dfx generate with env_override produces unquoted environment variable" {
    dfx_new hello
    jq '.canisters.hello_backend.declarations.env_override="process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND"' dfx.json | sponge dfx.json

    dfx_start
    dfx canister create --all
    dfx build
    dfx canister install --all

    dfx generate

    # Check that the generated file contains unquoted environment variable
    assert_contains "export const canisterId = process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND;" "src/declarations/hello_backend/index.js"
    assert_not_contains "export const canisterId = \"process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND\";" "src/declarations/hello_backend/index.js"
}
```

## Related Files

1. **Configuration**: `src/dfx-core/src/config/model/dfinity.rs`
2. **Processing**: `src/dfx/src/lib/canister_info.rs`
3. **Template**: `src/dfx/assets/language_bindings/canister.js`
4. **Bug Location**: `src/dfx/src/lib/builders/mod.rs`
5. **Documentation**: `docs/cli-reference/dfx-generate.mdx`
6. **Schema**: `docs/dfx-json-schema.json`

## Environment

- **dfx version**: 0.29.0 (and likely earlier versions)
- **Affected platforms**: All platforms (macOS, Linux, Windows)
- **Project types**: Next.js, Vite, Create React App, and other frontend frameworks
- **Target**: Browser environments requiring environment variable prefixes

## Priority

**High** - This is a breaking bug that prevents proper integration with modern frontend frameworks and requires manual workarounds for all users of the `env_override` feature.
