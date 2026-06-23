import "server-only";

import type { Credential as CredentialRow } from "@prisma/client";

import { getPrisma } from "./db";
import type {
  ComputeProvenance,
  IssuedCredential,
  ArtifactKind,
  ProvenanceMethod,
} from "./types";

// Re-export the pure builder so existing imports keep working.
export { buildCredential } from "./credential-builder";
export type { IssueInput } from "./credential-builder";

function mapFromDb(row: CredentialRow): IssuedCredential {
  let compute: ComputeProvenance | undefined;
  let teeProof = row.teeProof ?? undefined;
  if (typeof row.teeProof === "string" && row.teeProof.startsWith("{")) {
    try {
      const parsed = JSON.parse(row.teeProof);
      if (parsed?.version === 1 && parsed?.compute) {
        compute = parsed.compute as ComputeProvenance;
        teeProof = `request_id:${compute.requestId};provider:${compute.provider};chat_id:${compute.chatId}`;
      }
    } catch {
      // Legacy free-form TEE proof; leave it unchanged.
    }
  }

  return {
    credential: {
      schema: row.schema as "veritable.credential.v1",
      id: row.id,
      issuer: row.issuer,
      issuerHash: row.issuerHash ?? undefined,
      provenance: row.provenance as ProvenanceMethod,
      claim: row.claim,
      model: row.model ?? undefined,
      prompt: row.prompt ?? undefined,
      teeProof,
      compute,
      issuedAt: row.issuedAt.toISOString(),
      artifact: {
        id: row.artifactId,
        contentType: row.contentType,
        kind: row.kind as ArtifactKind,
        filename: row.filename ?? undefined,
        sha256: row.sha256,
        byteLength: row.byteLength,
      },
    },
    proof: {
      mode: row.proofMode as "0g" | "local",
      rootHash: row.rootHash,
      transactionHash: row.transactionHash ?? undefined,
      transactionUrl: row.transactionUrl ?? undefined,
      uploaderAddress: row.uploaderAddress ?? undefined,
      chainId: row.chainId ?? undefined,
      encryptionScope: (row.encryptionScope as "legacy-global" | "owner-v1") ?? undefined,
      archivedAt: row.archivedAt.toISOString(),
    },
  };
}

export async function remember(issuedCredential: IssuedCredential): Promise<void> {
  const { credential, proof } = issuedCredential;
  await getPrisma().credential.create({
    data: {
      id: credential.id,
      schema: credential.schema,
      issuer: credential.issuer,
      issuerHash: credential.issuerHash,
      provenance: credential.provenance,
      claim: credential.claim,
      model: credential.model,
      prompt: credential.prompt,
      teeProof: credential.compute
        ? JSON.stringify({ version: 1, compute: credential.compute })
        : credential.teeProof,
      issuedAt: new Date(credential.issuedAt),
      artifactId: credential.artifact.id,
      contentType: credential.artifact.contentType,
      kind: credential.artifact.kind,
      filename: credential.artifact.filename,
      sha256: credential.artifact.sha256,
      byteLength: credential.artifact.byteLength,
      proofMode: proof.mode,
      rootHash: proof.rootHash,
      transactionHash: proof.transactionHash,
      transactionUrl: proof.transactionUrl,
      uploaderAddress: proof.uploaderAddress,
      chainId: proof.chainId,
      encryptionScope: proof.encryptionScope,
      archivedAt: new Date(proof.archivedAt),
    },
  });
}

export async function getCredential(id: string): Promise<IssuedCredential | undefined> {
  const row = await getPrisma().credential.findUnique({ where: { id } });
  return row ? mapFromDb(row) : undefined;
}

export async function listCredentials(): Promise<IssuedCredential[]> {
  const rows = await getPrisma().credential.findMany({
    orderBy: { issuedAt: "desc" },
  });
  return rows.map(mapFromDb);
}
