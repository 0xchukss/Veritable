import "server-only";

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  deriveIssuerEncryptionKey,
  hashIssuer,
  parseEncryptionKey,
} from "./crypto";
import { withoutSdkDebugLogs } from "./sdk-logging";
import type { Credential, StorageProof, Verification } from "./types";

export interface CredentialArchive {
  archive(credential: Credential, issuerId: string): Promise<StorageProof>;
  verify(
    proof: StorageProof,
    issuerId: string,
    expectedArtifactHash: string,
  ): Promise<Verification>;
}

/**
 * Local-only archive for development when no 0G credentials are configured.
 * Writes the plaintext credential to disk so the full create/verify loop can be
 * exercised without spending testnet funds. The UI must label this mode.
 */
export class LocalCredentialArchive implements CredentialArchive {
  constructor(private readonly archiveDirectory: string) {}

  async archive(credential: Credential): Promise<StorageProof> {
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
    _issuerId: string,
    expectedArtifactHash: string,
  ): Promise<Verification> {
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
        ? credential.issuerHash === hashIssuer(_issuerId)
        : null,
      encryptionScope: proof.encryptionScope ?? "legacy-global",
      verifiedAt: new Date().toISOString(),
    };
  }
}

/**
 * 0G Storage archive. The credential is encrypted with an issuer-derived AES
 * key, committed to 0G Storage (producing a Merkle root + on-chain tx), and can
 * later be re-downloaded with a Merkle proof to prove it has not been altered.
 *
 * This is the load-bearing piece: the credential's integrity does not depend on
 * any single server — it depends on the 0G network.
 */
export class ZeroGCredentialArchive implements CredentialArchive {
  constructor(
    private readonly config: {
      privateKey: string;
      encryptionKey: string;
      rpcUrl: string;
      indexerUrl: string;
      explorerUrl: string;
    },
  ) {}

  async archive(
    credential: Credential,
    issuerId: string,
  ): Promise<StorageProof> {
    const [{ Indexer, MemData }, { JsonRpcProvider, Wallet }] =
      await Promise.all([
        import("@0gfoundation/0g-storage-ts-sdk"),
        import("ethers"),
      ]);

    const encryptionKey = deriveIssuerEncryptionKey(
      this.config.encryptionKey,
      issuerId,
    );
    const file = new MemData(
      new TextEncoder().encode(JSON.stringify(credential)),
    );
    const [, treeError] = await file.merkleTree();
    if (treeError) {
      throw treeError;
    }

    const provider = new JsonRpcProvider(this.config.rpcUrl);
    const signer = new Wallet(this.config.privateKey, provider);
    const network = await provider.getNetwork();
    const indexer = new Indexer(this.config.indexerUrl);
    const [result, uploadError] = await withoutSdkDebugLogs(() =>
      indexer.upload(file, this.config.rpcUrl, signer, {
        expectedReplica: 1,
        finalityRequired: true,
        encryption: { type: "aes256", key: encryptionKey },
      }),
    );

    if (uploadError) {
      throw uploadError;
    }

    const rootHash =
      "rootHash" in result ? result.rootHash : result.rootHashes[0];
    const transactionHash =
      "txHash" in result ? result.txHash : result.txHashes[0];

    return {
      mode: "0g",
      rootHash,
      transactionHash,
      transactionUrl: `${this.config.explorerUrl.replace(/\/$/, "")}/tx/${transactionHash}`,
      uploaderAddress: signer.address,
      chainId: network.chainId.toString(),
      encryptionScope: "owner-v1",
      archivedAt: new Date().toISOString(),
    };
  }

  async verify(
    proof: StorageProof,
    issuerId: string,
    expectedArtifactHash: string,
  ): Promise<Verification> {
    if (!proof.transactionHash) {
      throw new Error("The storage proof does not include a transaction hash.");
    }

    const [{ Indexer }, { JsonRpcProvider }] = await Promise.all([
      import("@0gfoundation/0g-storage-ts-sdk"),
      import("ethers"),
    ]);
    const provider = new JsonRpcProvider(this.config.rpcUrl);
    const receipt = await provider.getTransactionReceipt(proof.transactionHash);
    const encryptionScope = proof.encryptionScope ?? "legacy-global";
    const encryptionKey =
      encryptionScope === "owner-v1"
        ? deriveIssuerEncryptionKey(this.config.encryptionKey, issuerId)
        : parseEncryptionKey(this.config.encryptionKey);
    const indexer = new Indexer(this.config.indexerUrl);
    const [blob, downloadError] = await withoutSdkDebugLogs(() =>
      indexer.downloadToBlob(proof.rootHash, {
        proof: true,
        decryption: { symmetricKey: encryptionKey },
      }),
    );
    if (downloadError) {
      throw downloadError;
    }

    let credential: Credential | null = null;
    try {
      credential = JSON.parse(await blob.text()) as Credential;
    } catch {
      // A wrong decryption key returns ciphertext rather than throwing.
    }

    return {
      mode: "0g",
      transactionFinalized: receipt?.status === 1,
      blockNumber: receipt?.blockNumber,
      merkleProofVerified: true,
      decryptionSucceeded: credential?.schema === "veritable.credential.v1",
      artifactHashMatched:
        credential?.artifact.sha256 === expectedArtifactHash,
      issuerMatched: credential?.issuerHash
        ? credential.issuerHash === hashIssuer(issuerId)
        : null,
      encryptionScope,
      verifiedAt: new Date().toISOString(),
    };
  }
}
