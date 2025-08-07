# Futura Pre-Alpha: Project Architecture Overview

## Project Summary

**Futura** is a digital preservation platform designed to help users safeguard their memories, documents, and digital legacy for future generations. The application enables users to upload, organize, and securely store important digital assets with the promise of long-term preservation.

### Core Value Proposition

- **Tagline**: "Live Forever. Now."
- **Mission**: Enable users to preserve their digital legacy, ensuring important memories remain accessible to future generations regardless of technological changes or personal circumstances

## Technical Stack

### Frontend & Framework

- **Next.js 15** with App Router (latest version)
- **React 19** (latest version)
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Shadcn/ui** for component library

### Backend & Database

- **PostgreSQL** database hosted on **Neon**
- **Drizzle ORM** for database operations
- **Vercel Blob** for file storage
- **NextAuth.js v5** for authentication

### External Services

- **Mailgun** for email services
- **PostHog** for analytics
- **GitHub & Google OAuth** for authentication providers

### Development & Deployment

- **pnpm** for package management
- **Vercel** for deployment
- **ESLint** for code linting
- **Turbopack** for development builds

## Application Architecture

### 1. Internationalization (i18n)

The application supports **8 languages** with a sophisticated routing system:

- **Supported Languages**: English, French, Spanish, Portuguese, Italian, German, Polish, Chinese
- **URL Structure**: `/{lang}/...` (e.g., `/en/`, `/fr/`, `/es/`)
- **Default Language**: English (`en`)
- **Implementation**: Custom middleware handles locale detection and redirects

### 2. User Segmentation Strategy

Futura implements a **multi-segment targeting system** for personalized experiences:

**Target Segments**:

1. **Personal** - Individuals preserving personal memories
2. **Family** - Users focused on family history and generational connections
3. **Business** - Organizations preserving institutional knowledge
4. **Creative** - Artists, writers, and creators preserving portfolios
5. **Academic** - Researchers and educators preserving scholarly work

**Current Implementation**:

- Cookie-based segment preference storage
- Segment-specific content delivery via dictionary system
- URL structure supports both `/[lang]/` and `/[lang]/[segment]/` patterns

### 3. Authentication System

**NextAuth.js v5** (Auth.js) implementation with:

**Providers**:

- GitHub OAuth
- Google OAuth
- Credentials (email/password with bcrypt hashing)

**Strategy**:

- JWT-based sessions for performance
- Database adapter using Drizzle ORM
- Custom user roles: `user`, `moderator`, `admin`, `developer`, `superadmin`
- Premium/Free plan support

### 4. Database Architecture

**PostgreSQL** with **Drizzle ORM** featuring:

**Core Tables**:

- `users` - Main user accounts (NextAuth.js compatible)
- `all_users` - Unified user system (permanent + temporary)
- `temporary_users` - Temporary users for onboarding
- `accounts`, `sessions`, `verificationTokens` - NextAuth.js tables

**Content Tables**:

- `images` - Image uploads with metadata
- `documents` - Document uploads
- `notes` - Text-based memories
- `memory_share` - Sharing system

**Relationship System**:

- `relationships` - User-to-user connections
- `family_member` - Family tree structure
- `family_relationship` - Complex family relationships

## Key Features

### 1. Onboarding Flow

- **Two-step process**: Items Upload → Profile Setup
- **Temporary user system** for anonymous uploads
- **Secure code system** for user retrieval
- **Modal-based flow** with step progression

### 2. Memory Management

- **Multi-format support**: Images, documents, notes
- **Metadata system** with custom fields
- **Public/private visibility controls**
- **Sharing capabilities** between users

### 3. Family Tree System

- **Complex relationship modeling** with primary and fuzzy relationships
- **Multi-generational support** with ancestor tracking
- **Birthplace and date tracking**
- **Metadata support** for additional details

### 4. User Interface

- **Responsive design** with mobile-first approach
- **Dark/light theme support** via next-themes
- **Component architecture** with reusable UI elements
- **Navigation system** with sidebar and bottom navigation

## Project Structure

```
futura_pre-alpha/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [lang]/            # Internationalized routes
│   │   │   ├── [segment]/     # Segment-specific routes
│   │   │   ├── onboarding/    # Onboarding flow
│   │   │   └── user/          # User dashboard
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── ui/               # Shadcn/ui components
│   │   ├── onboarding/       # Onboarding components
│   │   └── memory/           # Memory-related components
│   ├── db/                   # Database layer
│   │   ├── schema.ts         # Drizzle schema
│   │   ├── migrations/       # Database migrations
│   │   └── fixtures/         # Test data
│   ├── utils/                # Utility functions
│   ├── hooks/                # Custom React hooks
│   ├── contexts/             # React contexts
│   ├── types/                # TypeScript type definitions
│   └── lib/                  # Library configurations
├── docs/                     # Documentation
├── public/                   # Static assets
└── codebase_analysis/        # This analysis documentation
```

## Current Development Status

### ✅ Implemented Features

- Complete authentication system with multiple providers
- Internationalization with 8 language support
- Database schema with complex relationship modeling
- Onboarding flow with temporary user system
- File upload and storage system
- User segmentation infrastructure
- Responsive UI with theme support

### 🚧 In Development

- User segmentation content delivery optimization
- Family tree visualization
- Advanced sharing mechanisms
- Premium features implementation

### 📋 Architecture Decisions

- **JWT over database sessions** for performance
- **Temporary user system** for seamless onboarding
- **Cookie-based segmentation** for marketing effectiveness
- **Path-based internationalization** for SEO benefits
- **Component-based architecture** for maintainability

## Best Practices Observed

### ✅ Good Practices

- **Type safety** with comprehensive TypeScript usage
- **Component separation** with clear responsibilities
- **Database constraints** and foreign key relationships
- **Error handling** in authentication flows
- **Middleware optimization** for static file serving
- **Environment variable management** for configuration

### 🔄 Areas for Consideration

- **Foreign key constraints** are commented out in some tables (intentional for race conditions)
- **Complex user system** with both permanent and temporary users
- **Multiple authentication strategies** may need consolidation
- **Segment detection logic** could be more sophisticated

This overview provides the foundation for understanding Futura's architecture. The following documents will dive deeper into specific aspects of the system.
