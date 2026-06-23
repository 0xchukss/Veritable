import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { hashIssuer } from "./crypto";
import type { CredentialArchive } from "./archive-contract";
import type {
  ArchiveVerification,
  Credential,
  StorageProof,
} from "./types";

/**
 * Local-only archive for development when no 0G credentials are configured.
 * Writes the plaintext credential to disk so the full create/verify loop can be
 * exercised without spending testnet funds. The UI must label this mode.
 *
 * Deliberately free of "server-only" so the tamper-detection logic is unit
 * testable. The same hash/issuer comparisons run in the 0G archive.
 */
export class LocalCredentialArchive implements CredentialArchive {
  constructor(private readonly archiveDirectory: string) {}

  // _issuerId is required for CredentialArchive conformance; unused locally.
  async archive(
    credential: Credential,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _issuerId: string,
  ): Promise<StorageProof> {
    const serialized = JSON.stringify(credential);
    const digest = createHash("sha256").update(serialized).digest("hex");
    await mkdir(this.archiveDirectory, { recursive: true });
    await writeFile(
      path.join(this.archiveDirectory, `${digest}.json`),
      serialized,
      "utf8",
    );

    return {
      mode: "local",
      rootHash: `local:${digest}`,
      encryptionScope: "owner-v1",
      archivedAt: new Date().toISOString(),
    };
  }

  async verify(
    proof: StorageProof,
    issuerId: string,
    expectedArtifactHash: string,
  ): Promise<ArchiveVerification> {
    const digest = proof.rootHash.replace(/^local:/, "");
    const raw = await readFile(
      path.join(this.archiveDirectory, `${digest}.json`),
      "utf8",
    );
    const actualDigest = createHash("sha256").update(raw).digest("hex");
    const credential = JSON.parse(raw) as Credential;
    return {
      mode: "local",
      transactionFinalized: false,
      merkleProofVerified: actualDigest === digest,
      decryptionSucceeded: true,
      artifactHashMatched: credential.artifact.sha256 === expectedArtifactHash,
      issuerMatched: credential.issuerHash
        ? credential.issuerHash === hashIssuer(issuerId)
        : null,
      computeProvenanceMatched: credential.compute
        ? credential.compute.outputHash === expectedArtifactHash
        : null,
      computeTeeVerified: null,
      computeModelVerified: null,
      encryptionScope: proof.encryptionScope ?? "legacy-global",
      verifiedAt: new Date().toISOString(),
      archivedCredential: credential,
    };
  }
}
