import Image from "next/image";
import Link from "next/link";

import { SiteFooter } from "./site-footer";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-[var(--color-ink)]">
      <header className="border-b border-[var(--color-line)]">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Image src="/icon.png" alt="" width={20} height={20} />
            Veritable
          </Link>
          <Link href="/app" className="btn-primary !px-4 !py-2">
            Try Veritable
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
        <p className="text-sm text-[var(--color-muted)]">Updated {updated}</p>
        <h1 className="font-display mt-2 text-4xl font-semibold">{title}</h1>
        <div className="legal-copy mt-10 space-y-8 text-[var(--color-ink-soft)]">
          {children}
        </div>
      </main>
      <SiteFooter theme="light" />
    </div>
  );
}
