"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";

type CredentialData = {
  credential: {
    id: string;
    claim: string;
    provenance: string;
    issuer: string;
    model?: string;
    teeProof?: string;
    issuedAt: string;
    artifact: {
      sha256: string;
      kind: string;
      contentType: string;
      byteLength: number;
      filename?: string;
    };
  };
  proof: {
    mode: string;
    rootHash: string;
    transactionHash?: string;
    transactionUrl?: string;
    uploaderAddress?: string;
    chainId?: string;
    archivedAt: string;
  };
};

type VerificationResult = {
  transactionFinalized: boolean;
  merkleProofVerified: boolean;
  decryptionSucceeded: boolean;
  artifactHashMatched: boolean;
  issuerMatched: boolean | null;
  blockNumber?: number;
  verifiedAt: string;
};

const SOFT = [0.22, 1, 0.36, 1] as const;

export default function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [data, setData] = useState<CredentialData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<VerificationResult | null>(null);

  useEffect(() => {
    params.then((p) => {
      setId(p.id);
      fetch(`/api/credentials`)
        .then((r) => r.json())
        .then((list) => {
          const match = list.credentials?.find(
            (c: any) => c.credential.id === p.id
          );
          if (match) setData(match);
          else setError("Credential not found.");
        })
        .catch(() => setError("Failed to load credential."))
        .finally(() => setLoading(false));
    });
  }, [params]);

  const handleVerify = useCallback(async () => {
    if (!id) return;
    setVerifying(true);
    setVerification(null);
    try {
      const res = await fetch(`/api/credentials/${id}/verify`, { method: "POST" });
      const d = await res.json();
      if (d.error) setError(d.error);
      else setVerification(d.verification);
    } catch {
      setError("Verification failed.");
    } finally {
      setVerifying(false);
    }
  }, [id]);

  const allPass = verification
    ? verification.merkleProofVerified &&
      verification.decryptionSucceeded &&
      verification.artifactHashMatched &&
      (verification.issuerMatched ?? true)
    : null;

  return (
    <div className="min-h-screen bg-[#08080b] text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <img src="/icon.png" alt="Veritable" className="h-5 w-5 object-contain" />
            Veritable
          </Link>
          <span className="text-xs text-white/40">Public verification</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-20"
          >
            <motion.span
              className="inline-block h-6 w-6 rounded-full border-2 border-white border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        )}

        {error && !data && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-red-400"
          >
            {error}
          </motion.div>
        )}

        {data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: SOFT }}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className={`inline-block h-3 w-3 rounded-full ${
                allPass === true ? "bg-emerald-400" : allPass === false ? "bg-red-400" : "bg-white/30"
              }`} />
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {allPass === true
                  ? "Credential verified ✓"
                  : allPass === false
                  ? "Verification failed"
                  : "Credential"}
              </h1>
            </div>

            <p className="text-white/50 text-sm mb-8">
              Independently verify this credential against the 0G network. No account needed.
            </p>

            {/* Credential Details */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-white/40 mb-4">Credential details</h2>
              <div className="grid gap-3 text-sm">
                <Row label="Claim" value={data.credential.claim} />
                <Row label="Provenance" value={data.credential.provenance} />
                <Row label="Artifact SHA-256" value={data.credential.artifact.sha256} mono />
                <Row label="Artifact kind" value={data.credential.artifact.kind} />
                {data.credential.model && <Row label="Model" value={data.credential.model} />}
                {data.credential.teeProof && <Row label="TEE Proof" value={data.credential.teeProof} mono />}
                <Row label="Issuer" value={data.credential.issuer} />
                <Row label="Issued" value={new Date(data.credential.issuedAt).toLocaleString()} />
              </div>
            </div>

            {/* 0G Proof */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md mt-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-white/40 mb-4">0G Storage proof</h2>
              <div className="grid gap-3 text-sm">
                <Row label="Root hash" value={data.proof.rootHash} mono />
                {data.proof.transactionHash && (
                  <Row label="Transaction" value={data.proof.transactionHash} mono />
                )}
                {data.proof.transactionUrl && (
                  <a
                    href={data.proof.transactionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline text-sm"
                  >
                    View on 0G explorer ↗
                  </a>
                )}
              </div>
            </div>

            {/* Verify Button */}
            <motion.button
              type="button"
              onClick={handleVerify}
              disabled={verifying}
              whileTap={{ scale: 0.98 }}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {verifying ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                  />
                  Verifying against 0G…
                </span>
              ) : (
                "Verify this credential on 0G"
              )}
            </motion.button>

            {/* Verification Results */}
            <AnimatePresence>
              {verification && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: SOFT }}
                  className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`inline-block h-3 w-3 rounded-full ${allPass ? "bg-emerald-400" : "bg-red-400"}`} />
                    <h2 className="text-sm font-semibold">
                      {allPass ? "All checks passed" : "Verification failed"}
                    </h2>
                  </div>
                  <div className="grid gap-2 text-sm">
                    <Check label="Transaction finalized" ok={verification.transactionFinalized} />
                    <Check label="Merkle proof verified" ok={verification.merkleProofVerified} />
                    <Check label="Decryption succeeded" ok={verification.decryptionSucceeded} />
                    <Check label="Artifact hash matched" ok={verification.artifactHashMatched} />
                    <Check label="Issuer matched" ok={verification.issuerMatched ?? true} />
                    {verification.blockNumber && (
                      <p className="text-xs text-white/40 mt-2">Block #{verification.blockNumber}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Powered by */}
            <p className="mt-8 text-center text-xs text-white/30">
              Powered by Veritable · Provenance anchored on the 0G network
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-white/40">{label}</span>
      <span className={`${mono ? "font-mono text-xs" : ""} break-all text-white/80`}>{value}</span>
    </div>
  );
}

function Check({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
          ok ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
        }`}
      >
        {ok ? "✓" : "✗"}
      </span>
      <span className="text-white/70">{label}</span>
    </div>
  );
}
