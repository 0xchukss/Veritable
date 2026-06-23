import "server-only";

import {
  deriveIssuerEncryptionKey,
  hashIssuer,
  parseEncryptionKey,
} from "./crypto";
import type { CredentialArchive } from "./archive-contract";
import { withoutSdkDebugLogs } from "./sdk-logging";
import type {
  ArchiveVerification,
  Credential,
  StorageProof,
} from "./types";

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
    try {
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
    } finally {
      // ethers v6 providers hold a WebSocket/polling connection. Destroy it so
      // it doesn't leak an "unhandledRejection: provider is disconnected" after
      // the request completes.
      provider.destroy();
    }
  }

  async verify(
    proof: StorageProof,
    issuerId: string,
    expectedArtifactHash: string,
  ): Promise<ArchiveVerification> {
    if (!proof.transactionHash) {
      throw new Error("The storage proof does not include a transaction hash.");
    }

    const [{ Indexer }, { JsonRpcProvider }] = await Promise.all([
      import("@0gfoundation/0g-storage-ts-sdk"),
      import("ethers"),
    ]);
    const provider = new JsonRpcProvider(this.config.rpcUrl);
    try {
      const receipt = await provider.getTransactionReceipt(
        proof.transactionHash,
      );
      const encryptionScope = proof.encryptionScope ?? "legacy-global";
      const encryptionKey =
        encryptionScope.startsWith("owner-")
          ? deriveIssuerEncryptionKey(this.config.encryptionKey, issuerId, encryptionScope)
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

      const buffer = await blob.arrayBuffer();
      let credential: Credential | null = null;
      const merkleProofVerified = true; // SDK verifies the proof via { proof: true } during downloadToBlob
      
      try {
        const text = new TextDecoder().decode(buffer);
        const cleanText = text.replace(/\0+$/, "");
        credential = JSON.parse(cleanText) as Credential;
      } catch {
        // A wrong decryption key returns ciphertext rather than throwing.
      }

      return {
        mode: "0g",
        transactionFinalized: receipt?.status === 1,
        blockNumber: receipt?.blockNumber,
        merkleProofVerified,
        decryptionSucceeded: credential?.schema === "veritable.credential.v1",
        artifactHashMatched:
          credential?.artifact.sha256 === expectedArtifactHash,
        issuerMatched: credential?.issuerHash
          ? credential.issuerHash === hashIssuer(issuerId)
          : null,
        computeProvenanceMatched: credential?.compute
          ? credential.compute.outputHash === expectedArtifactHash
          : null,
        computeTeeVerified: null,
        computeModelVerified: null,
        encryptionScope: encryptionScope as "owner-v1" | "legacy-global",
        verifiedAt: new Date().toISOString(),
        archivedCredential: credential,
      };
    } finally {
      provider.destroy();
    }
  }
}
