/**
 * Protected dashboard page.
 *
 * Shows the authenticated user's journal entries and provides
 * navigation to key features. Redirects to /login if not authenticated.
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-stone-950 px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-400">Dashboard</h1>
            <p className="text-sm text-stone-400">
              Welcome back
              {session.user.name ? `, ${session.user.name}` : ""}.
            </p>
          </div>
          <SignOutButton />
        </header>

        <section className="rounded-lg border border-stone-800 bg-stone-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-stone-200">
            Your Journal
          </h2>
          <p className="text-stone-400">
            Your journal entries will appear here. Start writing to build your
            Stoic practice streak.
          </p>
        </section>
      </div>
    </main>
  );
}
