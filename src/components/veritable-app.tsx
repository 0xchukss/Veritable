"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { Nav } from "./nav";
import { MotionShapes } from "./motion-shapes";
import type {
  Credential,
  ProvenanceMethod,
  StorageProof,
  Verification,
} from "@/lib/veritable/types";

type Issued = { credential: Credential; proof: StorageProof };
type Mode = "idle" | "uploading" | "verifying";

const SOFT = [0.22, 1, 0.36, 1] as const;

const PROVENANCE_OPTIONS: { value: ProvenanceMethod; label: string }[] = [
  { value: "ai-generated", label: "AI-generated" },
  { value: "human-authored", label: "Human-authored" },
  { value: "captured", label: "Captured (photo/recording)" },
];

export function VeritableApp() {
  const [provenance, setProvenance] = useState<ProvenanceMethod>("ai-generated");
  const [claim, setClaim] = useState("");
  const [model, setModel] = useState("");
  const [prompt, setPrompt] = useState("");
  const [issuer, setIssuer] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("idle");
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<Issued | null>(null);
  const [verification, setVerification] = useState<Verification | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setIssued(null);
    setVerification(null);
    setError(null);
  }, []);

  const onPickFile = (f: File | null) => {
    setFile(f);
    setText("");
    reset();
  };

  const onPickText = (t: string) => {
    setText(t);
    setFile(null);
    reset();
  };

  const canSubmit =
    mode === "idle" &&
    claim.trim().length > 0 &&
    (file !== null || text.trim().length > 0);

  const handleIssue = useCallback(async () => {
    if (!canSubmit) return;
    setMode("uploading");
    setError(null);
    setIssued(null);
    setVerification(null);

    try {
      const form = new FormData();
      form.set("provenance", provenance);
      form.set("claim", claim.trim());
      if (issuer.trim()) form.set("issuer", issuer.trim());
      if (model.trim()) form.set("model", model.trim());
      if (prompt.trim()) form.set("prompt", prompt.trim());

      if (file) {
        form.set("artifact", file, file.name);
      } else {
        form.set("text", text);
      }

      const res = await fetch("/api/credentials", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to issue credential.");
      }
      setIssued(data as Issued);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setMode("idle");
    }
  }, [canSubmit, claim, file, issuer, model, prompt, provenance, text]);

  const handleVerify = useCallback(async () => {
    if (!issued) return;
    setMode("verifying");
    setError(null);
    setVerification(null);
    try {
      const res = await fetch(`/api/credentials/${issued.credential.id}/verify`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Verification failed.");
      }
      setVerification((data as { verification: Verification }).verification);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setMode("idle");
    }
  }, [issued]);

  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden bg-white">
      <MotionShapes />
      <Nav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: SOFT }}
        >
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Issue a credential
          </h1>
          <p className="mt-3 text-[var(--color-muted)]">
            Attach an artifact and provenance. Veritable commits it to 0G Storage
            and returns a tamper-evident credential anchored on the 0G chain.
          </p>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 overflow-hidden rounded-xl border border-[var(--color-danger-soft)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.section
          className="block mt-8 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: SOFT, delay: 0.08 }}
        >
          <div className="grid gap-5">
            <ArtifactInput
              file={file}
              text={text}
              onPickFile={onPickFile}
              onPickText={onPickText}
              fileInputRef={fileInputRef}
            />

            <Field label="What does this credential claim?">
              <input
                type="text"
                value={claim}
                onChange={(e) => {
                  setClaim(e.target.value);
                  reset();
                }}
                placeholder="e.g. Generated by Acme Studio's image model"
                className="input"
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Provenance">
                <select
                  value={provenance}
                  onChange={(e) => {
                    setProvenance(e.target.value as ProvenanceMethod);
                    reset();
                  }}
                  className="select"
                >
                  {PROVENANCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Issuer (optional)">
                <input
                  type="text"
                  value={issuer}
                  onChange={(e) => {
                    setIssuer(e.target.value);
                    reset();
                  }}
                  placeholder="anonymous"
                  className="input"
                />
              </Field>
            </div>

            {provenance === "ai-generated" && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Model (optional)">
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => {
                      setModel(e.target.value);
                      reset();
                    }}
                    placeholder="e.g. stable-diffusion-xl"
                    className="input"
                  />
                </Field>
                <Field label="Prompt (optional)">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value);
                      reset();
                    }}
                    placeholder="the prompt that produced it"
                    className="input"
                  />
                </Field>
              </div>
            )}

            <motion.button
              type="button"
              onClick={handleIssue}
              disabled={!canSubmit}
              whileTap={{ scale: 0.98 }}
              className="btn-primary mt-2 w-full"
            >
              {mode === "uploading" ? (
                <>
                  <Spinner /> Committing to 0G…
                </>
              ) : (
                <>Issue credential on 0G</>
              )}
            </motion.button>
            {mode === "uploading" && (
              <p className="text-center text-xs text-[var(--color-muted)]">
                Real storage upload + chain finality. This takes ~15–30s.
              </p>
            )}
          </div>
        </motion.section>

        <AnimatePresence>
          {issued && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.5, ease: SOFT }}
            >
              <ProofPanel
                issued={issued}
                mode={mode}
                verification={verification}
                onVerify={handleVerify}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function ArtifactInput({
  file,
  text,
  onPickFile,
  onPickText,
  fileInputRef,
}: {
  file: File | null;
  text: string;
  onPickFile: (f: File | null) => void;
  onPickText: (t: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn-ghost"
        >
          {file ? file.name : "Choose file…"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
        />
        <span className="self-center text-xs text-[var(--color-muted)]">
          or paste text
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => onPickText(e.target.value)}
        placeholder="Paste the artifact text here (or choose a file above)…"
        rows={4}
        className="textarea resize-y"
      />
    </div>
  );
}

function ProofPanel({
  issued,
  mode,
  verification,
  onVerify,
}: {
  issued: Issued;
  mode: Mode;
  verification: Verification | null;
  onVerify: () => void;
}) {
  const { credential, proof } = issued;
  const isLocal = proof.mode === "local";

  return (
    <section className="block mt-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Credential issued</h2>
        <span className={`stamp ${isLocal ? "stamp-pending" : "stamp-verified"}`}>
          <span className={`dot ${isLocal ? "dot-brand" : "dot-verified"}`} />
          {isLocal ? "Local mode" : "Anchored on 0G"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 text-sm">
        <Row label="Artifact SHA-256" value={credential.artifact.sha256} mono />
        <Row label="Kind" value={credential.artifact.kind} />
        <Row label="Claim" value={credential.claim} />
        <Row label="Provenance" value={credential.provenance} />
        {credential.model && <Row label="Model" value={credential.model} />}
        <Row label="Issued" value={credential.issuedAt} />
      </div>

      <div className="block-surface mt-5 p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Verify on 0G
        </h3>
        <div className="grid gap-2 text-xs">
          <Row label="Root hash" value={proof.rootHash} mono small />
          {proof.transactionHash && (
            <Row label="Transaction" value={proof.transactionHash} mono small />
          )}
          {proof.transactionUrl && (
            <a
              href={proof.transactionUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-brand)] hover:underline"
            >
              View on 0G explorer ↗
            </a>
          )}
          {proof.uploaderAddress && (
            <Row label="Uploader" value={proof.uploaderAddress} mono small />
          )}
          {proof.chainId && <Row label="Chain ID" value={proof.chainId} small />}
        </div>
      </div>

      <motion.button
        type="button"
        onClick={onVerify}
        disabled={mode !== "idle"}
        whileTap={{ scale: 0.98 }}
        className="btn-ghost mt-5 w-full border-[var(--color-brand)]/40 bg-[var(--color-brand-soft)]/40 text-[var(--color-brand-deep)] hover:bg-[var(--color-brand-soft)]"
      >
        {mode === "verifying" ? (
          <>
            <Spinner /> Verifying against 0G…
          </>
        ) : (
          <>Verify credential on 0G</>
        )}
      </motion.button>

      <AnimatePresence>
        {verification && <VerificationResult v={verification} />}
      </AnimatePresence>
    </section>
  );
}

function VerificationResult({ v }: { v: Verification }) {
  const allPass =
    v.merkleProofVerified &&
    v.decryptionSucceeded &&
    v.artifactHashMatched &&
    (v.issuerMatched ?? true);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: SOFT }}
      className="block-surface mt-4 p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className={`dot ${allPass ? "dot-verified" : "dot-danger"}`} />
        <h3 className="text-sm font-semibold">
          {allPass ? "Verified" : "Verification failed"}
        </h3>
      </div>
      <div className="grid gap-1.5 text-xs">
        <Check label="Transaction finalized" ok={v.transactionFinalized} />
        <Check label="Merkle proof download" ok={v.merkleProofVerified} />
        <Check label="Decryption succeeded" ok={v.decryptionSucceeded} />
        <Check label="Artifact hash matched" ok={v.artifactHashMatched} />
        <Check
          label="Issuer matched"
          ok={v.issuerMatched === null ? true : v.issuerMatched}
        />
        {v.blockNumber && <Row label="Block" value={String(v.blockNumber)} small />}
      </div>
    </motion.div>
  );
}

function Row({
  label,
  value,
  mono,
  small,
}: {
  label: string;
  value: string;
  mono?: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </span>
      <span
        className={`${mono ? "font-mono" : ""} ${small ? "text-xs" : ""} break-all text-[var(--color-ink)]`}
      >
        {value}
      </span>
    </div>
  );
}

function Check({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
          ok
            ? "bg-[var(--color-verified-soft)] text-[var(--color-verified)]"
            : "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
        }`}
      >
        {ok ? "✓" : "✗"}
      </span>
      <span className="text-[var(--color-ink-soft)]">{label}</span>
    </div>
  );
}

function Spinner() {
  return (
    <motion.span
      className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
    />
  );
}
