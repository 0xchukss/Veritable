import "server-only";

import { randomUUID } from "node:crypto";

import { hashIssuer } from "./crypto";
import type { Credential, IssuedCredential, ProvenanceMethod } from "./types";

/**
 * In-memory registry of issued credentials, keyed by credential id.
 *
 * Phase 1 persistence. The durable truth is the 0G Storage archive — this map
 * is only an index so the UI can list and re-verify issued credentials without
 * re-deriving roots. Phase 3 swaps this for Postgres.
 */
const issued = new Map<string, IssuedCredential>();

export interface IssueInput {
  artifact: Credential["artifact"];
  issuer: string;
  provenance: ProvenanceMethod;
  claim: string;
  model?: string;
  prompt?: string;
}

/** Construct a signed Credential object (schema-tagged, issuer-hashed). */
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

export function remember(issued_credential: IssuedCredential): void {
  issued.set(issued_credential.credential.id, issued_credential);
}

export function getCredential(id: string): IssuedCredential | undefined {
  return issued.get(id);
}

export function listCredentials(): IssuedCredential[] {
  return Array.from(issued.values()).sort((a, b) =>
    b.credential.issuedAt.localeCompare(a.credential.issuedAt),
  );
}
