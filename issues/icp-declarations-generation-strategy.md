# ICP Declarations Generation Strategy for Next.js Integration

## Problem

We're integrating an ICP frontend with our Next.js application. The ICP project auto-generates TypeScript/JavaScript declaration files in a `declarations/` directory that provide the interface between frontend and backend canisters.

## Current ICP Setup

- **Development**: DFX generates declarations in `../declarations/` relative to the frontend
- **Production**: Declarations are generated during ICP deployment process
- **Vite config**: Uses alias to map `"declarations"` imports to the generated files

## Next.js Integration Challenge

We're deploying to **traditional hosting (Vercel)**, not to the Internet Computer. We need to handle declaration generation for our Next.js build process.

## Proposed Solutions

### Option 1: Generate Declarations Inside Next.js Project

- Run DFX to generate declarations inside our Next.js project directory
- Add webpack alias to point to the local declarations
- Include DFX in our build process

### Option 2: Copy Declarations on GitHub Push

- Copy generated declarations from ICP project to Next.js project
- Commit the declarations to our repo
- Use local path for imports

## Questions for ICP Documentation AI

1. **Best practice**: Should we generate declarations inside the Next.js project or copy them?
2. **Build process**: How to integrate DFX declaration generation into a Next.js build pipeline?
3. **File structure**: What's the recommended directory structure for declarations in a hybrid setup?
4. **Dependencies**: What DFX commands/tools are needed for declaration generation?
5. **Production**: How to handle declarations when deploying to traditional hosting vs ICP?

## Current Understanding

- Declarations are essential for type-safe canister communication
- They contain auto-generated interfaces from Rust backend
- Vite uses path aliases to resolve `"declarations"` imports
- Next.js needs equivalent webpack configuration

## Priority

High - This is blocking the ability to import and use ICP canister interfaces in our Next.js application.
