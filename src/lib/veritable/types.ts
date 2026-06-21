/**
 * Veritable core types.
 *
 * The model is intentionally small. A Credential binds an Artifact to provenance
 * metadata (issuer, model, prompt, timestamp). Both are committed to 0G Storage
 * so the binding is tamper-evident, and the storage transaction anchors it on
 * the 0G chain. Removing 0G removes the trust root — the credential has no
 * meaning without an independent, verifiable place to live.
 */

/** Kind of artifact a credential can attest to. */
export type ArtifactKind = "image" | "text" | "audio" | "video" | "document";

/** A byte-level representation of the thing being proven. */
export type Artifact = {
  /** Stable identifier (uuid). */
  id: string;
  /** Content type, e.g. "image/png". */
  contentType: string;
  /** Categorical kind, derived from contentType. */
  kind: ArtifactKind;
  /** Original filename if the client provided one. */
  filename?: string;
  /** SHA-256 of the raw artifact bytes, hex without 0x. This is the binding. */
  sha256: string;
  /** Byte length of the artifact. */
  byteLength: number;
};

/** How the artifact was produced. Drives the strength of the provenance claim. */
export type ProvenanceMethod = "ai-generated" | "human-authored" | "captured";

/** A tamper-evident statement that an artifact existed at a time, made by someone. */
export type Credential = {
  /** Schema tag for forward-compatible parsing. */
  schema: "veritable.credential.v1";
  /** Unique credential id. */
  id: string;
  /** The artifact this credential attests to. */
  artifact: Artifact;
  /** Who issued the credential (account id, or "anonymous" for guest). */
  issuer: string;
  /** Hashed issuer for embedding inside the encrypted bundle (privacy). */
  issuerHash?: string;
  /** How the artifact was produced. */
  provenance: ProvenanceMethod;
  /** Free-form description of what this credential claims. */
  claim: string;
  /** If AI-generated: which model produced it. Optional otherwise. */
  model?: string;
  /** If AI-generated: the prompt that produced it. Optional otherwise. */
  prompt?: string;
  /** ISO timestamp when the credential was issued (server time). */
  issuedAt: string;
};

/** Everything you need to verify a credential, stored client-side after issuance. */
export type IssuedCredential = {
  credential: Credential;
  proof: StorageProof;
};

/** The on-0G proof that a credential was archived. */
export type StorageProof = {
  mode: "0g" | "local";
  rootHash: string;
  transactionHash?: string;
  transactionUrl?: string;
  uploaderAddress?: string;
  chainId?: string;
  /** Whether encryption is owner-scoped or a shared key (legacy). */
  encryptionScope?: "legacy-global" | "owner-v1";
  archivedAt: string;
};

/** Result of independently re-verifying a stored credential against 0G. */
export type Verification = {
  mode: "0g" | "local";
  /** Whether the storage transaction reached finality. */
  transactionFinalized: boolean;
  blockNumber?: number;
  /** Whether the Merkle-proof download succeeded. */
  merkleProofVerified: boolean;
  /** Whether the downloaded bytes decrypted to a valid credential schema. */
  decryptionSucceeded: boolean;
  /** Whether the decrypted artifact hash matches the credential's claimed hash. */
  artifactHashMatched: boolean;
  /** Whether the decrypted issuer hash matches the claimed issuer. */
  issuerMatched: boolean | null;
  encryptionScope: "legacy-global" | "owner-v1";
  verifiedAt: string;
};
