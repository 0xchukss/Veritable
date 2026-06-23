"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Nav() {
  const pathname = usePathname();
  const onApp = pathname?.startsWith("/app");

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[var(--color-canvas)]/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-[var(--color-ink)]"
        >
          <Image
            src="/icon.png"
            alt="Veritable Logo"
            width={20}
            height={20}
            className="object-contain"
          />
          Veritable
        </Link>

        <div className="flex items-center gap-1 text-sm">
          <Link
            href="/"
            className={`rounded-lg px-3 py-2 font-medium transition ${onApp ? "text-[var(--color-muted)] hover:text-[var(--color-ink)]" : "text-[var(--color-ink)]"}`}
          >
            Overview
          </Link>
          <Link
            href="/app"
            className={`rounded-lg px-3 py-2 font-medium transition ${onApp ? "text-[var(--color-ink)]" : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"}`}
          >
            Prove it
          </Link>
          <a
            href="https://0g.ai"
            target="_blank"
            rel="noreferrer"
            className="ml-2 hidden items-center gap-1.5 rounded-lg px-3 py-2 text-[var(--color-muted)] transition hover:text-[var(--color-ink)] sm:inline-flex"
          >
            <span className="dot dot-brand" />
            Built on 0G
          </a>
        </div>
      </nav>
    </header>
  );
}
