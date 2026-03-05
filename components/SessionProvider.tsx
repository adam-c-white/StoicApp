/**
 * NextAuth SessionProvider wrapper for client components.
 *
 * This must be a client component because SessionProvider uses
 * React Context internally.
 */

"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export default function SessionProvider({ children }: { children: ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
