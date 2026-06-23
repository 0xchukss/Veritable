import "server-only";

import { getArchive } from "./factory";
import {
  buildCredential,
  remember,
  type IssueInput,
} from "./store";
import { verifyComputeProvider } from "./compute-verification";
import type { IssuedCredential, StorageProof, Verification } from "./types";

/**
 * Issue a credential: build it, archive to 0G (or local), remember it.
 * Returns the issued credential + its on-0G proof.
 */
export async function issue(
  input: IssueInput,
): Promise<IssuedCredential> {
  const credential = buildCredential(input);
  const archive = getArchive();
  const proof = await archive.archive(credential, input.issuer);
  const issued: IssuedCredential = { credential, proof };
  await remember(issued);
  return issued;
}

/**
 * Independently re-verify a stored credential against 0G Storage: download with
 * Merkle proof, decrypt, confirm the artifact hash + issuer match. This is the
 * operation a skeptical third party performs — it trusts only the 0G network.
 */
export async function verify(
  proof: StorageProof,
  issuerId: string,
  expectedArtifactHash: string,
): Promise<Verification> {
  const archive = getArchive();
  const archiveResult = await archive.verify(
    proof,
    issuerId,
    expectedArtifactHash,
  );
  const { archivedCredential, ...verification } = archiveResult;
  const compute = archivedCredential?.compute;

  if (!compute) {
    return verification;
  }

  try {
    const fresh = await verifyComputeProvider(
      compute.provider,
      compute.model,
    );
    return {
      ...verification,
      computeTeeVerified: compute.routerTeeVerified,
      computeModelVerified: fresh.modelVerified,
    };
  } catch (error) {
    console.error("0G Compute provenance re-verification failed:", error);
    return {
      ...verification,
      computeTeeVerified: compute.routerTeeVerified,
      computeModelVerified: false,
    };
  }
}
