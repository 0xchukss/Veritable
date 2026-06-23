import type {
  ArchiveVerification,
  Credential,
  StorageProof,
} from "./types";

/**
 * The archive contract. Kept separate from both implementations so the local
 * archive (which has no "server-only" import) can be unit tested without
 * transitively pulling in the 0G archive.
 */
export interface CredentialArchive {
  archive(credential: Credential, issuerId: string): Promise<StorageProof>;
  verify(
    proof: StorageProof,
    issuerId: string,
    expectedArtifactHash: string,
  ): Promise<ArchiveVerification>;
}
