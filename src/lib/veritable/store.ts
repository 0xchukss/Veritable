import "server-only";

import { prisma } from "./db";
import type { IssuedCredential, ArtifactKind, ProvenanceMethod } from "./types";

// Re-export the pure builder so existing imports keep working.
export { buildCredential } from "./credential-builder";
export type { IssueInput } from "./credential-builder";

function mapFromDb(row: any): IssuedCredential {
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
      teeProof: row.teeProof ?? undefined,
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
  await prisma.credential.create({
    data: {
      id: credential.id,
      schema: credential.schema,
      issuer: credential.issuer,
      issuerHash: credential.issuerHash,
      provenance: credential.provenance,
      claim: credential.claim,
      model: credential.model,
      prompt: credential.prompt,
      teeProof: credential.teeProof,
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
  const row = await prisma.credential.findUnique({ where: { id } });
  return row ? mapFromDb(row) : undefined;
}

export async function listCredentials(): Promise<IssuedCredential[]> {
  const rows = await prisma.credential.findMany({
    orderBy: { issuedAt: "desc" },
  });
  return rows.map(mapFromDb);
}
