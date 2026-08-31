import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-6 text-stone-950">
      <section className="w-full max-w-md border border-stone-300 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-800">
          Private collection
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Link Gallery</h1>
        <p className="mt-3 text-base leading-7 text-stone-600">
          Save and organize image links from around the web.
        </p>
        <Link
          className="mt-7 inline-flex min-h-11 items-center border border-emerald-900 bg-emerald-900 px-4 text-sm font-medium text-white"
          href="/gallery"
        >
          Open gallery
        </Link>
      </section>
    </main>
  );
}
