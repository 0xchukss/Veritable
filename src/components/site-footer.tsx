import Image from "next/image";
import Link from "next/link";

export function SiteFooter({ theme = "dark" }: { theme?: "dark" | "light" }) {
  const dark = theme === "dark";

  return (
    <footer
      className={`border-t px-6 py-9 ${
        dark
          ? "border-white/10 bg-[#08080b] text-white"
          : "border-[var(--color-line)] bg-white text-[var(--color-ink)]"
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 font-semibold">
            <Image src="/icon.png" alt="" width={18} height={18} />
            Veritable
          </Link>
          <p className={`mt-2 text-sm ${dark ? "text-white/45" : "text-[var(--color-muted)]"}`}>
            Open-source provenance infrastructure, anchored on 0G.
          </p>
          <p className={`mt-2 text-xs ${dark ? "text-white/35" : "text-[var(--color-muted)]"}`}>
            © 2026 Veritable. Built for 0G Zero Cup.
          </p>
        </div>

        <nav aria-label="Footer" className={`flex flex-wrap gap-x-5 gap-y-2 text-sm ${dark ? "text-white/60" : "text-[var(--color-muted)]"}`}>
          <a className="transition hover:text-[var(--color-brand)]" href="https://github.com/0xchukss/Veritable" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a className="transition hover:text-[var(--color-brand)]" href="https://0g.ai" target="_blank" rel="noreferrer">
            0G
          </a>
          <a className="transition hover:text-[var(--color-brand)]" href="https://chainscan-galileo.0g.ai" target="_blank" rel="noreferrer">
            Explorer
          </a>
          <Link className="transition hover:text-[var(--color-brand)]" href="/roadmap">
            Roadmap
          </Link>
          <Link className="transition hover:text-[var(--color-brand)]" href="/privacy">
            Privacy
          </Link>
          <Link className="transition hover:text-[var(--color-brand)]" href="/terms">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
