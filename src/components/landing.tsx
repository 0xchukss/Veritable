"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "motion/react";

import { Logo3DClient } from "./logo-3d-client";
import { FadeUp, Stagger, staggerItem } from "./motion";

export function Landing() {
  const { scrollYProgress } = useScroll();
  // The 3D scene reads scroll from a plain ref each frame (no React re-renders).
  // We mirror Framer's MotionValue into it here.
  const scrollRef = useRef<number>(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    scrollRef.current = v;
  });

  return (
    <div className="grid min-h-screen grid-cols-1 grid-rows-1 text-white bg-[#08080b]">
      {/* 3D Background Layer - Uses sticky instead of fixed to avoid mobile viewport and transform bugs */}
      <div className="col-start-1 row-start-1 h-full w-full bg-[#08080b]">
        <div className="sticky top-0 h-screen w-full overflow-hidden pointer-events-auto">
          <Logo3DClient scrollRef={scrollRef} />
        </div>
      </div>

      {/* Content Layer */}
      <div className="col-start-1 row-start-1 relative z-10 flex flex-col pointer-events-none">
        
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-white/10 pointer-events-auto">
          {/* Animated gradient mesh blobs — sit behind the hero text, above the 3D */}
          <div className="gradient-mesh" />
          <div className="grid-bg pointer-events-none absolute inset-0 h-[640px] opacity-30" />
          <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-24 pt-20 text-center sm:pt-28">


            <FadeUp delay={0.05}>
              <h1 className="font-display mt-6 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
                Prove what&rsquo;s real.
              </h1>
            </FadeUp>

            <FadeUp delay={0.12}>
              <p className="mx-auto mt-5 max-w-2xl text-lg text-white/60 sm:text-xl">
                Everything is AI now. Veritable attaches a cryptographically verifiable
                credential to any image, document, or voice clip — anchored on the{" "}
                <span className="font-semibold text-white">0G network</span>,
                so anyone can check what&rsquo;s real, independently.
              </p>
            </FadeUp>

          {/* 3D logo showcase removed — now it is full screen */}

            <FadeUp delay={0.26}>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link href="/app" className="btn-primary">
                  Prove something
                  <span aria-hidden>→</span>
                </Link>
                <a
                  href="https://chainscan-galileo.0g.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost !border-white/20 !text-white hover:!bg-white/10"
                >
                  See it on-chain
                </a>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* PROBLEM */}
        <section className="relative pointer-events-auto overflow-hidden bg-white/5 backdrop-blur-md border-b border-white/10">
          <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
            <FadeUp>
              <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-brand)]">
                The problem
              </p>
            </FadeUp>
            <FadeUp delay={0.05}>
              <h2 className="font-display mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                You can&rsquo;t trust a file. You can&rsquo;t trust a screenshot.
                You can&rsquo;t trust a platform.
              </h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="mt-6 max-w-2xl text-lg text-white/60">
                An image has no memory. A platform can edit or delete anything. A
                &ldquo;this is AI&rdquo; label lives on one company&rsquo;s server,
                which can be faked, hacked, or quietly changed.
              </p>
            </FadeUp>

          <Stagger className="mt-12 grid gap-5 sm:grid-cols-3">
              {[
                {
                  k: "01",
                  t: "Anyone can fake a label",
                  d: "A PNG metadata tag, an EXIF field, a blog post — all trivially edited after the fact.",
                },
                {
                  k: "02",
                  t: "Platforms have kill-switches",
                  d: "The record of what something is sits on one server. Delete it, change it, deplatform it — gone.",
                },
                {
                  k: "03",
                  t: "Trust is asserted, not proven",
                  d: "“Verified by X” means you trust X. It does not mean you can check X.",
                },
              ].map((c) => (
                <motion.div key={c.k} variants={staggerItem} className="block !bg-white/5 !border-white/10 p-6 backdrop-blur-md">
                  <span className="font-mono text-xs text-[var(--color-brand)]">{c.k}</span>
                  <h3 className="mt-3 text-lg font-semibold text-white">{c.t}</h3>
                  <p className="mt-2 text-sm text-white/60">{c.d}</p>
                </motion.div>
              ))}
            </Stagger>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="relative border-b border-white/10 pointer-events-auto overflow-hidden">
          <div className="section-glow section-glow-purple" />
          <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
              <FadeUp>
                <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-brand)]">
                  How it works
                </p>
                <h2 className="font-display mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                  One credential.
                  <br />
                  One trust root.
                  <br />
                  No company in the middle.
                </h2>
                <p className="mt-6 text-lg text-white/60">
                  Veritable binds an artifact to its provenance and commits that
                  binding to 0G Storage. The proof is verifiable by anyone, with no
                  account and no middleman.
                </p>
              </FadeUp>

              <Stagger className="flex flex-col gap-4">
                {[
                  {
                    n: "1",
                    t: "Issue",
                    d: "Drop an artifact. Veritable hashes it and binds it to provenance — who, what model, what prompt.",
                  },
                  {
                    n: "2",
                    t: "Anchor",
                    d: "The credential is encrypted and committed to 0G Storage. A transaction anchors it on the 0G chain.",
                  },
                  {
                    n: "3",
                    t: "Verify",
                    d: "Anyone downloads the credential with a Merkle proof, decrypts it, and confirms the hash matches — trusting only 0G.",
                  },
                ].map((s) => (
                  <motion.div key={s.n} variants={staggerItem} className="block !bg-black/40 !border-white/10 flex items-start gap-5 p-6 backdrop-blur-md">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 font-mono text-sm text-white">
                      {s.n}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold">{s.t}</h3>
                      <p className="mt-1 text-sm text-white/60">{s.d}</p>
                    </div>
                  </motion.div>
                ))}
              </Stagger>
            </div>
          </div>
        </section>

        {/* WHY 0G */}
        <section className="relative pointer-events-auto overflow-hidden bg-purple-900/20 backdrop-blur-lg border-b border-white/10">
          <div className="section-glow section-glow-purple opacity-50" />
          <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
            <FadeUp>
              <p className="text-sm font-semibold uppercase tracking-widest text-[#d8b4fe]">
                Why 0G
              </p>
            </FadeUp>
            <FadeUp delay={0.05}>
              <h2 className="font-display mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                The trust root doesn&rsquo;t live on a server.
                <br />
                It lives on the network.
              </h2>
            </FadeUp>
            <Stagger className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 sm:grid-cols-3 bg-white/10 backdrop-blur-md">
              {[
                {
                  t: "0G Storage",
                  d: "Encrypted credential bytes, retrievable by Merkle proof. Removing it removes the trust root.",
                },
                {
                  t: "0G Chain",
                  d: "Every credential is anchored by a finalized transaction. The timestamp is real.",
                },
                {
                  t: "Independent check",
                  d: "Verification downloads + decrypts + compares hashes. It trusts the network, not our database.",
                },
              ].map((c) => (
                <motion.div
                  key={c.t}
                  variants={staggerItem}
                  className="bg-black/40 p-7"
                >
                  <h3 className="text-base font-semibold text-white">{c.t}</h3>
                  <p className="mt-2 text-sm text-white/60">{c.d}</p>
                </motion.div>
              ))}
            </Stagger>
          </div>
        </section>

        {/* CTA */}
        <section className="relative border-b border-white/10 pointer-events-auto overflow-hidden">
          <div className="gradient-mesh" />
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 py-24 text-center">
            <FadeUp>
              <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                Prove what isn&rsquo;t AI.
              </h2>
            </FadeUp>
            <FadeUp delay={0.08}>
              <p className="mt-5 max-w-xl text-lg text-white/60">
                Issue a credential in under a minute. No account required.
              </p>
            </FadeUp>
            <FadeUp delay={0.16}>
              <Link href="/app" className="btn-primary mt-8">
                Try Veritable
                <span aria-hidden>→</span>
              </Link>
            </FadeUp>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-6 py-10 pointer-events-auto">
      <div className="flex flex-col items-center justify-between gap-4 text-sm text-white/40 sm:flex-row">
        <div className="flex items-center gap-2">
          <img src="/icon.png" alt="Veritable Logo" className="h-4 w-4 object-contain opacity-70 grayscale contrast-200 brightness-200" />
          <span className="font-semibold text-white">Veritable</span>
        </div>
        <p>Provenance for the AI era · built on 0G</p>
      </div>
    </footer>
  );
}
