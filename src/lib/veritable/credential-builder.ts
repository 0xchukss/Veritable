import { randomUUID } from "node:crypto";

import { hashIssuer } from "./crypto";
import type { Credential, ProvenanceMethod } from "./types";

export interface IssueInput {
  artifact: Credential["artifact"];
  issuer: string;
  provenance: ProvenanceMethod;
  claim: string;
  model?: string;
  prompt?: string;
}

/** Construct a Credential object (schema-tagged, issuer-hashed). Pure + testable. */
export function buildCredential(input: IssueInput): Credential {
  return {
    schema: "veritable.credential.v1",
    id: randomUUID(),
    artifact: input.artifact,
    issuer: input.issuer,
    issuerHash: hashIssuer(input.issuer),
    provenance: input.provenance,
    claim: input.claim,
    model: input.model,
    prompt: input.prompt,
    issuedAt: new Date().toISOString(),
  };
}
