import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-950 px-6 text-center">
      <h1 className="mb-4 text-5xl font-bold tracking-tight text-amber-400">
        StoicApp
      </h1>
      <p className="mb-8 max-w-xl text-lg text-stone-300">
        A daily companion for Stoic philosophy — quotes, reflections, and
        journaling grounded in timeless wisdom.
      </p>
      <p className="mb-8 text-sm text-stone-500 italic">
        &ldquo;The impediment to action advances action. What stands in the way
        becomes the way.&rdquo; — Marcus Aurelius
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-md border border-amber-600 px-6 py-2 text-amber-400 transition hover:bg-amber-600 hover:text-white"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="rounded-md bg-amber-600 px-6 py-2 text-white transition hover:bg-amber-500"
        >
          Get Started
        </Link>
      </div>
    </main>
  );
}
