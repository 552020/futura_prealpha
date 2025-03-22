# auth.md

## How to add a role to the user

```ts
declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    accessToken?: string;
    user: User & {
      id: string;
    } & DefaultSession["user"];
  }
}
```

### Why This Works

1. **Proper Type Extension Order**:

   - First extends `User` interface with `role`
   - Then builds `Session.user` from:
     - Extended `User` (with role)
     - Required `id` field
     - Default session user properties

2. **Type Inheritance Chain**:

   ```
   Session.user = User & { id: string } & DefaultSession["user"]
                  │        │              │
                  │        │              └─ Next-Auth's base user properties
                  │        └─ Required ID field

   ```

## Failed Attempts

### Attempt 1: Direct Session.user Extension

```ts
typescript;
interface Session {
  user: {
    id: string;
    role: string;
  } & DefaultSession["user"];
}
```

❌ Failed because: Conflicts with NextAuth's base User type

### Attempt 2: Separate Role Type

```typescript
interface Session {
  accessToken?: string;
  user: DefaultSession["user"] & {
    id: string;
    role: string;
  };
}
```

❌ Failed because: Doesn't properly extend the User interface

### Attempt 3: Only Session Extension

```typescript
interface Session {
  user: {
    role: string;
  } & User;
}
```

❌ Failed because: Creates type conflict with existing User properties

## Key Learnings

1. NextAuth's type system is hierarchical
2. Extensions must happen at the correct level (User before Session)
3. Order of type intersections matters
4. Always extend base types rather than redefining them

## Usage Example

```typescript
const session = await auth();
if (session?.user?.role === "admin") {
  // Type-safe role access
}
```
