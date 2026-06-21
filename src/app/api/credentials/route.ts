import { NextResponse, type NextRequest } from "next/server";

import { buildArtifact } from "@/lib/veritable/artifact";
import { safeErrorMessage } from "@/lib/veritable/errors";
import { getEnv } from "@/lib/veritable/env";
import { issue } from "@/lib/veritable/service";
import { listCredentials } from "@/lib/veritable/store";
import type { ProvenanceMethod } from "@/lib/veritable/types";

export const dynamic = "force-dynamic";

const VALID_PROVENANCE: ProvenanceMethod[] = [
  "ai-generated",
  "human-authored",
  "captured",
];

/**
 * GET /api/credentials — list credentials issued in this server's memory.
 * Phase 1 index only; the durable truth is the 0G archive, not this list.
 */
export async function GET() {
  return NextResponse.json({
    credentials: listCredentials().map(({ credential, proof }) => ({
      credential,
      proof,
    })),
    storageMode: getEnv().VERITABLE_STORAGE_MODE,
  });
}

/**
 * POST /api/credentials — issue a credential for an artifact.
 *
 * Accepts multipart/form-data:
 *   - artifact: File (binary) OR text: string (when no file)
 *   - contentType: string (required when sending text)
 *   - provenance: "ai-generated" | "human-authored" | "captured"
 *   - claim: string
 *   - model: string (optional)
 *   - prompt: string (optional)
 *   - issuer: string (optional; defaults to "anonymous")
 *
 * Returns the issued credential + its 0G storage proof.
 */
export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data." },
      { status: 400 },
    );
  }

  const provenanceRaw = String(form.get("provenance") ?? "");
  if (!VALID_PROVENANCE.includes(provenanceRaw as ProvenanceMethod)) {
    return NextResponse.json(
      {
        error: `provenance must be one of: ${VALID_PROVENANCE.join(", ")}.`,
      },
      { status: 400 },
    );
  }
  const provenance = provenanceRaw as ProvenanceMethod;

  const claim = String(form.get("claim") ?? "").trim();
  if (!claim) {
    return NextResponse.json(
      { error: "claim is required." },
      { status: 400 },
    );
  }

  const issuer = String(form.get("issuer") ?? "anonymous").trim() || "anonymous";
  const model = String(form.get("model") ?? "").trim() || undefined;
  const prompt = String(form.get("prompt") ?? "").trim() || undefined;

  // Accept either a binary file or inline text as the artifact.
  const file = form.get("artifact");
  let bytes: Uint8Array;
  let contentType: string;
  let filename: string | undefined;

  if (file instanceof File && file.size > 0) {
    bytes = new Uint8Array(await file.arrayBuffer());
    contentType = file.type || "application/octet-stream";
    filename = file.name;
  } else {
    const text = String(form.get("text") ?? "");
    if (!text) {
      return NextResponse.json(
        { error: "Provide an 'artifact' file or a 'text' field." },
        { status: 400 },
      );
    }
    const declared = String(form.get("contentType") ?? "").trim();
    contentType = declared || "text/plain";
    bytes = new TextEncoder().encode(text);
  }

  // Hard size cap to keep testnet uploads bounded.
  const MAX_BYTES = 4 * 1024 * 1024;
  if (bytes.byteLength > MAX_BYTES) {
    return NextResponse.json(
      { error: `Artifact exceeds the ${MAX_BYTES} byte limit.` },
      { status: 413 },
    );
  }

  const artifact = buildArtifact(bytes, contentType, filename);

  try {
    const issued = await issue({
      artifact,
      issuer,
      provenance,
      claim,
      model,
      prompt,
    });
    return NextResponse.json({ credential: issued.credential, proof: issued.proof });
  } catch (error) {
    // Sanitize: never surface raw upstream/SDK messages (may leak RPC URLs or
    // internal detail). Map known recoverable states to honest user messages.
    const safe = safeErrorMessage(error, "Failed to commit the credential to storage.");
    return NextResponse.json({ error: safe }, { status: 502 });
  }
}
