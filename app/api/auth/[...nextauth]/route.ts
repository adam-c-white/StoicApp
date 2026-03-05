/**
 * NextAuth.js API route handler.
 *
 * Exposes the Auth.js GET and POST handlers at /api/auth/*.
 * This handles sign-in, sign-out, session, CSRF, and callback routes.
 */

import { handlers } from "@/lib/auth";

export const GET = handlers.GET;
export const POST = handlers.POST;
