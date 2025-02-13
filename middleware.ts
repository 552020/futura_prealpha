// Basic middleware setup - redirects to login for protected routes
export { auth as middleware } from "./auth";

// Alternative: Custom middleware with access to auth session
// export default auth((req) => {
//   console.log(req.auth) // Access session data
//   // Add custom middleware logic here
// })

// Configure which routes use the middleware
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
