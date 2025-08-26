# ICP Declarations Import Error

## Problem

We're getting a module resolution error when trying to import ICP declarations:

```
Cannot find module 'declarations/backend' or its corresponding type declarations.
```

## Current Setup

- **Import statement**: `import { backend } from "declarations/backend";`
- **Webpack alias**: `declarations: path.join(__dirname, "src/ic/declarations")`
- **Turbopack alias**: `declarations: path.join(__dirname, "src/ic/declarations")`
- **Target directory**: `src/ic/declarations/` (empty, just has .gitkeep)

## Error Details

The import is failing because:

1. **Declarations don't exist yet** - We haven't copied them from the ICP project
2. **Module resolution issue** - The alias might not be working correctly

## Questions for Senior Developer

1. **Import path**: Should we use `"declarations/backend"` or `"@/ic/declarations/backend"`?
2. **Turbopack vs Webpack**: Are the aliases configured correctly for both?
3. **Module resolution**: Is there a specific way to handle auto-generated declarations in Next.js?
4. **Development workflow**: Should we copy declarations first, then test imports?

## Current Status

- ✅ Environment variables working
- ✅ Webpack/Turbopack aliases configured
- ❌ Declarations import failing
- ❌ Need to copy actual declaration files

## Priority

High - This is blocking the ability to test ICP integration.
