/**
 * Sign-out button component.
 *
 * Uses next-auth/react to handle client-side sign-out and redirect.
 */

"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-md border border-stone-700 px-4 py-2 text-sm text-stone-300 transition hover:border-stone-500 hover:text-stone-100"
    >
      Sign Out
    </button>
  );
}
