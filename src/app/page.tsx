export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-neutral-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Built on 0G
      </span>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        Veritable
      </h1>
      <p className="text-lg text-neutral-400">
        Prove what&rsquo;s real in the AI age.
      </p>
    </main>
  );
}
