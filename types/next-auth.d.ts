/**
 * Extended NextAuth type declarations for StoicApp.
 *
 * Augments the default NextAuth types to include custom fields
 * (id, role) on the session user object.
 */

import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}
