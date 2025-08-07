# Futura Pre-Alpha: Codebase Analysis

This directory contains comprehensive technical documentation for the Futura digital preservation platform. These documents provide a complete map of the codebase architecture, implementation patterns, and system design decisions.

## Document Overview

### 📋 [01_project_overview.md](./01_project_overview.md)

**High-level architecture and project summary**

- Project mission and technical stack
- Key features and application structure
- Development status and architecture decisions
- Best practices and areas for improvement

### 🗄️ [02_database_schema.md](./02_database_schema.md)

**Database design and relationships**

- Complete schema analysis with table structures
- Dual user system (permanent + temporary users)
- Memory storage and sharing mechanisms
- Family tree and relationship modeling
- Performance considerations and security features

### 🧩 [03_component_architecture.md](./03_component_architecture.md)

**React component organization and patterns**

- Component hierarchy and organization
- Context-driven state management
- UI foundation with Shadcn/ui components
- Onboarding system architecture
- Memory management components

### 🌍 [04_internationalization_segmentation.md](./04_internationalization_segmentation.md)

**Multi-language and user segmentation system**

- 8-language internationalization implementation
- Dictionary system with lazy loading
- User segmentation strategy (Family, Creative, Business, etc.)
- Path-based routing and middleware
- Content delivery and fallback mechanisms

### 🎯 [05_ux_onboarding_flow.md](./05_ux_onboarding_flow.md)

**User experience and onboarding journey**

- Complete onboarding flow analysis
- Modal-based step progression
- Temporary user system for friction reduction
- Context-driven state management
- UX patterns and accessibility features

### ⚡ [06_nextjs_features.md](./06_nextjs_features.md)

**Next.js specific features and implementation**

- App Router architecture and file-based routing
- Server/Client component separation strategy
- API routes and full-stack capabilities
- Middleware implementation for i18n and analytics
- Static generation and performance optimizations
- Key differences from vanilla React applications

### 🔄 [07_vanilla_react_migration.md](./07_vanilla_react_migration.md)

**Migration complexity analysis and recommendations**

- Features that must be stripped or replaced
- Performance and SEO impact assessment
- Required alternative libraries and infrastructure
- Timeline estimates and cost-benefit analysis
- Detailed comparison of current vs. vanilla React architecture
- Strong recommendation against migration

### 🌐 [08_icp_deployment_considerations.md](./08_icp_deployment_considerations.md)

**ICP blockchain deployment requirements**

- ICP compatibility analysis for Next.js features
- Mandatory migration scenarios for decentralized hosting
- Frontend canister limitations and constraints
- Backend canister architecture requirements
- Timeline impact and alternative deployment strategies

### 🚀 [09_juno_nextjs_advantages.md](./09_juno_nextjs_advantages.md)

**Juno platform vs standard ICP canisters comparison**

- Juno's integrated services and development advantages
- Next.js support analysis and limitations comparison
- Migration timeline reduction (2-3 months vs 4-5 months)
- Built-in authentication, storage, and serverless functions
- Trade-offs between development speed and infrastructure control

### 🔄 [10_dual_build_strategy.md](./10_dual_build_strategy.md)

**Hybrid Web2/Web3 deployment strategy analysis**

- Vercel (Web2) + ICP (Web3) dual-platform approach
- Strategic advantages: market reach, risk distribution, feature preservation
- Implementation challenges: development complexity, data sync, cost overhead
- Technical architecture with platform abstraction layer
- Phased implementation plan and success metrics

## Key Insights

### 🏗️ **Architecture Strengths**

- **Sophisticated user system** handling both temporary and permanent users
- **Comprehensive internationalization** with 8 languages and segment support
- **Well-structured component hierarchy** with clear separation of concerns
- **Context-driven state management** with localStorage persistence
- **Flexible database schema** supporting complex relationships

### 🔧 **Technical Stack**

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: PostgreSQL, Drizzle ORM, NextAuth.js v5
- **Storage**: Vercel Blob for files, Neon for database
- **Deployment**: Vercel with pnpm package management

### 🎨 **UX Philosophy**

- **Friction-reduced onboarding** - upload first, register later
- **Progressive disclosure** - step-by-step information collection
- **Immediate value delivery** - users see their memory before committing
- **Personalized experiences** - segment-specific content and imagery

### 📊 **Data Model Highlights**

- **Polymorphic user references** via `allUsers` table
- **Flexible memory types** (images, documents, notes, videos)
- **Complex sharing system** (direct, group, relationship-based)
- **Family tree modeling** with fuzzy and resolved relationships

### 🌐 **Internationalization Features**

- **Path-based routing** (`/{lang}/` structure)
- **Dictionary system** with segment-specific content
- **Fallback mechanisms** (locale → English → defaults)
- **Dynamic content loading** based on user segments

## Navigation Guide

For developers new to the codebase:

1. **Start with** `01_project_overview.md` for the big picture
2. **Understand data** with `02_database_schema.md`
3. **Learn components** via `03_component_architecture.md`
4. **Explore i18n** through `04_internationalization_segmentation.md`
5. **Study UX flows** in `05_ux_onboarding_flow.md`
6. **Understand Next.js usage** via `06_nextjs_features.md`
7. **Evaluate migration complexity** through `07_vanilla_react_migration.md`
8. **ICP deployment considerations** via `08_icp_deployment_considerations.md`
9. **Juno platform advantages** through `09_juno_nextjs_advantages.md`
10. **Dual-build strategy analysis** in `10_dual_build_strategy.md`

For specific investigations:

- **Database questions** → Document #2
- **Component questions** → Document #3
- **Language/content questions** → Document #4
- **User flow questions** → Document #5
- **Next.js features questions** → Document #6
- **Migration planning questions** → Document #7
- **ICP/blockchain deployment questions** → Document #8
- **Juno vs standard canisters questions** → Document #9
- **Hybrid deployment strategy questions** → Document #10

## Development Context

This analysis was created to help developers (including the original author) understand and navigate the Futura codebase after time away from the project. Each document focuses on current implementation status rather than future roadmaps, providing a comprehensive map of how the system works today.

The documentation emphasizes:

- **How components fit together**
- **Data flow and relationships**
- **Implementation patterns and decisions**
- **Current capabilities and limitations**

---

_Last updated: [Current Date]_  
_Codebase version: Pre-Alpha_  
_Analysis scope: Complete system architecture_
