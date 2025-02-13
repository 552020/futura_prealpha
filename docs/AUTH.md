# Authentication Setup

This project uses Auth.js (formerly NextAuth.js) for authentication with both OAuth providers and database storage.

## Configuration Overview

We use a hybrid approach:

- JWT strategy for session management (faster, no DB queries for sessions)
- Database adapter for user storage (persistent user data)

### Key Files

#### 1. Core Authentication Files

1. `auth.ts` (root)
2. `src/db/schema.ts`
3. `app/api/auth/[...nextauth]/route.ts`
4. `middleware.ts`

##### middleware.ts

The middleware.ts file controls Next.js routing behavior before pages are rendered. For authentication, it:

**Basic Usage**:

- Checks if user is authenticated for protected routes
- Automatically redirects to login if needed
- Manages session tokens

**Custom Usage**:

- Access session data with `req.auth`
- Add custom logic (e.g., role-based access)
- Modify requests/responses
- Log authentication events

**Matcher Configuration**:

- Defines which routes use the middleware
- Excludes API routes and static files
- Can be customized for specific paths

Example custom middleware:

````ts
export default auth((req) => {
// Check user role
if (req.auth?.user?.role !== 'admin' && req.nextUrl.pathname.startsWith('/admin')) {
return Response.redirect(new URL('/unauthorized', req.url))
}
})
```

- Contains database schema for users and OAuth accounts
- Includes type definitions for database models

#### 2. Auth components

### Database Tables

1. **Users** (`users`)

   - Stores user profile information
   - Primary user data storage

2. **Accounts** (`accounts`)
   - Links OAuth accounts to users
   - Enables multiple providers per user

### Environment Variables

### Type Safety

TypeScript types are automatically handled through:

- Drizzle's type inference for database models
- Auth.js's built-in types for authentication
- Session type augmentation for user ID

## Development vs Production

### Development

- Uses localhost:3000
- Separate OAuth app credentials
- Local database

### Production

- Uses production domain
- Production OAuth credentials
- Production database

## Adding New OAuth Providers

1. Install provider package
2. Add provider config to `auth.ts`
3. Add OAuth credentials to environment variables
4. Update types if needed

## Session Management

- JWT-based for performance
- No database queries for session validation
- Session data includes user ID
- 30-day default expiry

## Security Notes

- JWT strategy cannot be revoked server-side
- User data persists in database
- OAuth tokens stored securely in database
- Environment variables must be kept secret
````
