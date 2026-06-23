import type {
  Credential,
  IssuedCredential,
  StorageProof,
} from "./types";

export type PublicCredential = Omit<Credential, "issuer" | "prompt"> & {
  issuerHash: string;
};

export type PublicIssuedCredential = {
  credential: PublicCredential;
  proof: StorageProof;
};

/** Remove private issuer identity and raw prompts from unauthenticated responses. */
export function toPublicIssuedCredential(
  issued: IssuedCredential,
): PublicIssuedCredential {
  const credential = issued.credential;
  return {
    credential: {
      schema: credential.schema,
      id: credential.id,
      artifact: credential.artifact,
      issuerHash: credential.issuerHash ?? "unavailable",
      provenance: credential.provenance,
      claim: credential.claim,
      model: credential.model,
      teeProof: credential.teeProof,
      compute: credential.compute,
      issuedAt: credential.issuedAt,
    },
    proof: issued.proof,
  };
}
