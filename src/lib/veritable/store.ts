import "server-only";

import type { IssuedCredential } from "./types";

// Re-export the pure builder so existing imports keep working.
export { buildCredential } from "./credential-builder";
export type { IssueInput } from "./credential-builder";

/**
 * In-memory registry of issued credentials, keyed by credential id.
 *
 * Phase 1 persistence. The durable truth is the 0G Storage archive — this map
 * is only an index so the UI can list and re-verify issued credentials without
 * re-deriving roots. Phase 3 swaps this for Postgres.
 */
const issued = new Map<string, IssuedCredential>();

export function remember(issuedCredential: IssuedCredential): void {
  issued.set(issuedCredential.credential.id, issuedCredential);
}

export function getCredential(id: string): IssuedCredential | undefined {
  return issued.get(id);
}

export function listCredentials(): IssuedCredential[] {
  return Array.from(issued.values()).sort((a, b) =>
    b.credential.issuedAt.localeCompare(a.credential.issuedAt),
  );
}
