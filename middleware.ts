/**
 * Next.js Middleware for route protection.
 *
 * Uses Auth.js to check authentication status and redirect
 * unauthenticated users away from protected routes.
 */

export { auth as middleware } from "@/lib/auth";

export const config = {
  /**
   * Match protected routes that require authentication.
   * Public routes (/, /login, /register, /api/auth/*) are excluded.
   */
  matcher: ["/dashboard/:path*", "/api/journal/:path*"],
};
