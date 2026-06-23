import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { LocalCredentialArchive } from "./local-archive";
import { buildArtifact } from "./artifact";
import { buildCredential } from "./credential-builder";

describe("LocalCredentialArchive tamper detection", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "veritable-archive-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("verifies the correct artifact hash", async () => {
    const archive = new LocalCredentialArchive(dir);
    const bytes = new TextEncoder().encode("the real artifact");
    const artifact = buildArtifact(bytes, "text/plain");
    const credential = buildCredential({
      artifact,
      issuer: "issuer-a",
      provenance: "human-authored",
      claim: "claim",
    });

    const proof = await archive.archive(credential, "issuer-a");
    const result = await archive.verify(proof, "issuer-a", artifact.sha256);

    expect(result.artifactHashMatched).toBe(true);
    expect(result.decryptionSucceeded).toBe(true);
    expect(result.merkleProofVerified).toBe(true);
  });

  it("REJECTS a tampered artifact hash", async () => {
    const archive = new LocalCredentialArchive(dir);
    const bytes = new TextEncoder().encode("the real artifact");
    const artifact = buildArtifact(bytes, "text/plain");
    const credential = buildCredential({
      artifact,
      issuer: "issuer-a",
      provenance: "human-authored",
      claim: "claim",
    });

    const proof = await archive.archive(credential, "issuer-a");
    // An attacker claims a DIFFERENT hash than what's stored on 0G.
    const tamperedHash = "f".repeat(64);
    const result = await archive.verify(proof, "issuer-a", tamperedHash);

    expect(result.artifactHashMatched).toBe(false);
  });

  it("binds 0G Compute provenance to the exact generated output", async () => {
    const archive = new LocalCredentialArchive(dir);
    const bytes = new TextEncoder().encode("generated output");
    const artifact = buildArtifact(bytes, "text/plain");
    const credential = buildCredential({
      artifact,
      issuer: "issuer-a",
      provenance: "ai-generated",
      claim: "Generated and verified by 0G Compute",
      compute: {
        system: "0g-compute-router",
        network: "testnet",
        model: "model-a",
        provider: "0x1111111111111111111111111111111111111111",
        requestId: "request-1",
        chatId: "chat-1",
        promptHash: "a".repeat(64),
        outputHash: artifact.sha256,
        routerTeeVerified: true,
        independentlyVerified: true,
        modelVerified: true,
        verifiedAt: new Date().toISOString(),
      },
    });

    const proof = await archive.archive(credential, "issuer-a");
    const original = await archive.verify(
      proof,
      "issuer-a",
      artifact.sha256,
    );
    const forged = await archive.verify(
      proof,
      "issuer-a",
      "f".repeat(64),
    );

    expect(original.computeProvenanceMatched).toBe(true);
    expect(forged.computeProvenanceMatched).toBe(false);
  });

  it("REJECTS a wrong issuer (cannot decrypt / issuer mismatch)", async () => {
    const archive = new LocalCredentialArchive(dir);
    const bytes = new TextEncoder().encode("artifact for issuer A");
    const artifact = buildArtifact(bytes, "text/plain");
    const credential = buildCredential({
      artifact,
      issuer: "issuer-a",
      provenance: "human-authored",
      claim: "claim",
    });

    const proof = await archive.archive(credential, "issuer-a");
    // Attacker claims to be a different issuer.
    const result = await archive.verify(proof, "attacker-b", artifact.sha256);

    expect(result.issuerMatched).toBe(false);
  });

  it("detects a forged credential file (digest mismatch)", async () => {
    const archive = new LocalCredentialArchive(dir);
    const bytes = new TextEncoder().encode("original artifact");
    const artifact = buildArtifact(bytes, "text/plain");
    const credential = buildCredential({
      artifact,
      issuer: "issuer-a",
      provenance: "human-authored",
      claim: "claim",
    });

    const proof = await archive.archive(credential, "issuer-a");
    // Tamper the root hash so it points at a non-existent file.
    const forgedProof = { ...proof, rootHash: "local:" + "0".repeat(64) };
    await expect(
      archive.verify(forgedProof, "issuer-a", artifact.sha256),
    ).rejects.toThrow();
  });
});
