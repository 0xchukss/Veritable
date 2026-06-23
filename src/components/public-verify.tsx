"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";

import type {
  PublicIssuedCredential,
} from "@/lib/veritable/public-credential";
import type { Verification } from "@/lib/veritable/types";
import { SiteFooter } from "./site-footer";

type VerifyResponse = {
  verification: Verification;
  observedArtifactHash: string | null;
  artifactSupplied: boolean;
};

export function PublicVerify({ credentialId }: { credentialId: string }) {
  const [data, setData] = useState<PublicIssuedCredential | null>(null);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/public/credentials/${credentialId}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body?.error ?? "Credential not found.");
        }
        setData(body as PublicIssuedCredential);
      })
      .catch((cause) => {
        if (cause instanceof Error && cause.name !== "AbortError") {
          setError(cause.message);
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [credentialId]);

  const verify = useCallback(async () => {
    setVerifying(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/public/credentials/${credentialId}`,
        { method: "POST" },
      );
      const result = (await response.json()) as VerifyResponse & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result.error ?? "Verification failed.");
      }
      setVerification(result.verification);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Verification failed.",
      );
    } finally {
      setVerifying(false);
    }
  }, [credentialId]);

  const allPass = verification
    ? verification.merkleProofVerified &&
      verification.decryptionSucceeded &&
      verification.artifactHashMatched &&
      (verification.issuerMatched ?? true) &&
      (verification.computeProvenanceMatched ?? true) &&
      (verification.computeTeeVerified ?? true) &&
      (verification.computeModelVerified ?? true)
    : null;

  return (
    <div className="min-h-screen bg-[#08080b] text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Image
              src="/icon.png"
              alt="Veritable"
              width={20}
              height={20}
              className="object-contain"
            />
            Veritable
          </Link>
          <nav aria-label="Verification navigation" className="flex items-center gap-3 text-xs">
            <Link href="/" className="text-white/55 transition hover:text-white">
              Overview
            </Link>
            <Link href="/app?demo=1" className="rounded-lg bg-white px-3 py-2 font-semibold text-black transition hover:bg-white/90">
              Demo
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {loading && <VerificationSkeleton />}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {data && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-8">
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/40">
                Veritable credential
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">
                {allPass === true
                  ? "Credential verified"
                  : allPass === false
                    ? "Verification failed"
                    : data.credential.claim}
              </h1>
              <p className="mt-2 text-sm text-white/50">
                ID {data.credential.id}
              </p>
              <div
                className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  data.credential.compute
                    ? "bg-emerald-400/10 text-emerald-300"
                    : "bg-amber-400/10 text-amber-300"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    data.credential.compute ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                {data.credential.compute
                  ? "AI provenance verified by 0G Compute"
                  : "Provenance declared by the credential issuer"}
              </div>
            </div>

            <Card title="Artifact">
              <Row label="Claim" value={data.credential.claim} />
              <Row label="SHA-256" value={data.credential.artifact.sha256} mono />
              <Row label="Kind" value={data.credential.artifact.kind} />
              <Row
                label="Issued"
                value={new Date(data.credential.issuedAt).toLocaleString()}
              />
              <Row label="Issuer fingerprint" value={data.credential.issuerHash} mono />
            </Card>

            {data.credential.compute && (
              <Card title="0G Compute provenance">
                <Row label="Model" value={data.credential.compute.model} />
                <Row label="Provider" value={data.credential.compute.provider} mono />
                <Row label="Request ID" value={data.credential.compute.requestId} mono />
                <Row label="TEE response ID" value={data.credential.compute.chatId} mono />
                <Row
                  label="Output binding"
                  value={data.credential.compute.outputHash}
                  mono
                />
              </Card>
            )}

            <Card title="0G Storage proof">
              <Row label="Root hash" value={data.proof.rootHash} mono />
              {data.proof.transactionHash && (
                <Row label="Transaction" value={data.proof.transactionHash} mono />
              )}
              {data.proof.transactionUrl && (
                <a
                  href={data.proof.transactionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-400 hover:underline"
                >
                  View transaction on 0G explorer ↗
                </a>
              )}
            </Card>

            <button
              type="button"
              onClick={verify}
              disabled={verifying}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3.5 font-semibold disabled:opacity-50"
            >
              {verifying ? "Verifying against 0G…" : "Verify independently"}
            </button>

            {verification && (
              <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6">
                <h2 className={`font-semibold ${allPass ? "text-emerald-400" : "text-red-400"}`}>
                  {allPass ? "All checks passed" : "One or more checks failed"}
                </h2>
                <div className="mt-4 grid gap-2 text-sm">
                  <Check label="Storage transaction finalized" ok={verification.transactionFinalized} />
                  <Check label="Merkle proof verified" ok={verification.merkleProofVerified} />
                  <Check label="Credential decrypted" ok={verification.decryptionSucceeded} />
                  <Check label="Artifact bytes matched" ok={verification.artifactHashMatched} />
                  <Check label="Issuer fingerprint matched" ok={verification.issuerMatched ?? true} />
                  {verification.computeProvenanceMatched !== null && (
                    <Check label="0G output bound to artifact" ok={verification.computeProvenanceMatched} />
                  )}
                  {verification.computeTeeVerified !== null && (
                    <Check label="0G Router TEE attestation verified" ok={verification.computeTeeVerified} />
                  )}
                  {verification.computeModelVerified !== null && (
                    <Check label="Provider model verified on-chain" ok={verification.computeModelVerified} />
                  )}
                </div>
                {allPass && (
                  <Link
                    href="/app?demo=1"
                    className="mt-6 flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-white/90"
                  >
                    Try the one-click demo →
                  </Link>
                )}
              </div>
            )}
          </motion.div>
        )}
      </main>
      <SiteFooter theme="dark" />
    </div>
  );
}

function VerificationSkeleton() {
  return (
    <div aria-label="Loading credential" className="animate-pulse py-8">
      <div className="h-3 w-40 rounded bg-white/10" />
      <div className="mt-4 h-9 w-3/4 rounded bg-white/10" />
      <div className="mt-8 h-64 rounded-xl border border-white/10 bg-white/5" />
      <div className="mt-4 h-40 rounded-xl border border-white/10 bg-white/5" />
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4 rounded-xl border border-white/10 bg-white/5 p-6">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-white/40">
        {title}
      </h2>
      <div className="grid gap-3 text-sm">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-white/40">{label}</span>
      <span className={`${mono ? "font-mono text-xs" : ""} break-all text-white/80`}>
        {value}
      </span>
    </div>
  );
}

function Check({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={ok ? "text-emerald-400" : "text-red-400"}>
        {ok ? "✓" : "✗"}
      </span>
      <span className="text-white/70">{label}</span>
    </div>
  );
}
