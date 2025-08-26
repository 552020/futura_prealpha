# Analysis of Existing Authentication System

## Overview

The Futura application currently uses **Auth.js (NextAuth.js)** for authentication. This is a comprehensive authentication solution that provides multiple authentication providers and session management for Next.js applications.

## Current Authentication Stack

- **Framework**: NextAuth.js v5 (Auth.js)
- **Database**: PostgreSQL (via Prisma ORM)
- **Session Management**: JWT-based sessions
- **Authentication Providers**: Multiple providers supported (Google, GitHub, etc.)

## Key Files and Components

### Core Authentication Files

- `src/nextjs/src/app/api/auth/[...nextauth]/route.ts` - NextAuth API route handler
- `src/nextjs/src/utils/authentication.ts` - Authentication utilities and guards
- `src/nextjs/prisma/schema.prisma` - Database schema for users and sessions

### Authentication Components

- `src/nextjs/src/components/auth/` - Authentication-related UI components
- `src/nextjs/src/app/[lang]/auth/` - Authentication pages (login, signup, etc.)

### Configuration Files

- `src/nextjs/src/lib/auth.ts` - NextAuth configuration
- `src/nextjs/.env.local` - Environment variables for auth providers

## Current Features

### Authentication Flow

1. **User Registration/Login** - Via Auth.js providers
2. **Session Management** - JWT-based sessions with database persistence
3. **Route Protection** - Authentication guards for protected routes
4. **User Profiles** - User data stored in PostgreSQL database

### Integration Points

- **Next.js App Router** - Full integration with Next.js 13+ app directory
- **Internationalization** - Multi-language support for auth flows
- **Database Integration** - User data persisted in PostgreSQL
- **API Protection** - Protected API routes using authentication

## Architecture Overview

### Session Management

- **JWT Tokens** - Stateless session management
- **Database Sessions** - Session data stored in PostgreSQL
- **Client-Side** - Session state managed by NextAuth.js client

### User Data Model

- **User Table** - Core user information
- **Account Table** - OAuth provider accounts
- **Session Table** - Active user sessions
- **Verification Token Table** - Email verification tokens

## Integration Questions for Senior Developer

1. **Domains: production URL(s) + staging/dev URL(s) for CSP/allowlists.**

   - **Answer**: Not needed for planning - will be configured during implementation
   - **Note**: Senior can provide general CSP configuration approach without specific URLs

2. **II provider choice: use id.ai now, or start on identity.ic0.app and keep a flag?**

   - **Answer**: Use the newer provider (id.ai) - don't care about the choice
   - **Note**: Will go with whatever the senior recommends as the current standard

3. **User linking policy: one app user ↔ many ICP principals allowed?**

   - **Answer**: Yes - one Auth.js user can link multiple ICP identities

4. **Existing DB: do you already have a "linked identities" table, or should we add one?**

   - **Answer**: No existing ICP identity linking table found in schema
   - **Current Schema**: Uses Drizzle ORM with PostgreSQL
   - **Auth Tables**: `users`, `accounts`, `sessions`, `verificationTokens` (standard Auth.js tables)
   - **Need to Add**: New table for linking Auth.js users to ICP principals

5. **Session cookie scope: any custom cookie domain/subdomain setup?**

   - **Answer**: No custom cookie domain configuration - using default NextAuth.js settings
   - **Current Setup**: JWT strategy with default cookie behavior
   - **Impact**: No special cookie restrictions to consider for ICP integration

6. **Where IC calls run today: purely client-side, or via Next API routes too?**

   - **Answer**: Currently client-side, but could also call from backend directly to canister
   - **Current Pattern**: `backendActor()` → `HttpAgent` → direct canister calls
   - **Future Possibility**: Server-side calls via Next.js API routes for certain operations
   - **Impact**: Need to consider both client-side and server-side authentication patterns

7. **Required UX: separate "Log in with II" vs "Connect II" from an existing web2 session?**

   - **Answer**: Unified approach - single login/signup button for both Auth.js and Internet Identity
   - **Flow**: Users choose Auth.js (Google/email) OR Internet Identity from same interface
   - **Account Linking**: Optional linking happens later in user settings/profile
   - **Key Focus**: This is the main area we want to explore - open to solutions
   - **Context**: We have full Auth.js setup but Web3 integration is also important

8. **Email-first users: should II linking be mandatory for any on-chain action?**

   - **Answer**: Not always necessary - developers can use their own principals for certain on-chain tasks

9. **Google-inside-II: OK to support (no Google token for you, only an II principal)?**

   - **Question**: Support users who authenticate with Google through Internet Identity (not directly with Google OAuth)?

10. **Migration: any existing ICP principals to import/link, or greenfield?**
    - **Answer**: No - greenfield implementation
