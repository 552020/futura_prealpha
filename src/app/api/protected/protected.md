# Protected Routes

This folder demonstrates how API protection works in conjunction with the route protection defined in `auth.ts`.

## Relationship with auth.ts

In `auth.ts`, we define protected patterns in the `authorized` callback:

```ts
callbacks: {
authorized({ request, auth }) {
const { pathname } = request.nextUrl;
const protectedPatterns = ["/admin", "/user/"];
const isProtectedPath = protectedPatterns.some((pattern) =>
pathname.startsWith(pattern)
);
if (isProtectedPath) return !!auth;
return true;
}
}
```

This callback protects page routes matching these patterns. Similarly, we can create protected API routes that follow the same security pattern, ensuring consistent access control across both pages and API endpoints.

While the middleware automatically protects pages, API routes need explicit protection using the `auth()` wrapper to maintain the same security model.
