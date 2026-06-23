import "server-only";

import type { NextRequest } from "next/server";

import { sha256Hex } from "./crypto";
import { verify } from "./service";
import { getCredential } from "./store";

const MAX_ARTIFACT_BYTES = 4 * 1024 * 1024;

async function getSuppliedArtifactHash(
  request: NextRequest,
): Promise<string | null> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return null;
  }

  const form = await request.formData();
  const file = form.get("artifact");
  let bytes: Uint8Array | null = null;

  if (file instanceof File && file.size > 0) {
    bytes = new Uint8Array(await file.arrayBuffer());
  } else if (form.has("text")) {
    bytes = new TextEncoder().encode(String(form.get("text") ?? ""));
  }

  if (!bytes) return null;
  if (bytes.byteLength > MAX_ARTIFACT_BYTES) {
    throw new Error(
      `Artifact exceeds the ${MAX_ARTIFACT_BYTES} byte verification limit.`,
    );
  }
  return sha256Hex(bytes);
}

export async function verifyCredentialRequest(
  id: string,
  request: NextRequest,
) {
  const stored = await getCredential(id);
  if (!stored) return null;

  const suppliedArtifactHash = await getSuppliedArtifactHash(request);
  const expectedArtifactHash =
    suppliedArtifactHash ?? stored.credential.artifact.sha256;
  const verification = await verify(
    stored.proof,
    stored.credential.issuer,
    expectedArtifactHash,
  );

  return {
    verification,
    proof: stored.proof,
    observedArtifactHash: suppliedArtifactHash,
    artifactSupplied: suppliedArtifactHash !== null,
  };
}
