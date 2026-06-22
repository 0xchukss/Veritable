import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { buildArtifact } from "@/lib/veritable/artifact";
import { safeErrorMessage } from "@/lib/veritable/errors";
import { getEnv } from "@/lib/veritable/env";
import { issue } from "@/lib/veritable/service";
import { listCredentials } from "@/lib/veritable/store";
import type { ProvenanceMethod } from "@/lib/veritable/types";
import { checkRateLimit } from "@/lib/veritable/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/credentials — list credentials issued in this server's memory.
 * Phase 1 index only; the durable truth is the 0G archive, not this list.
 */
export async function GET() {
  const list = await listCredentials();
  return NextResponse.json({
    credentials: list.map(({ credential, proof }) => ({
      credential,
      proof,
    })),
    storageMode: getEnv().VERITABLE_STORAGE_MODE,
  });
}

const MetadataSchema = z.object({
  provenance: z.enum(["ai-generated", "human-authored", "captured"]),
  claim: z.string().min(1, "claim is required.").max(280, "claim is too long."),
  model: z.string().max(100, "model is too long.").optional(),
  prompt: z.string().max(2000, "prompt is too long.").optional(),
});

/**
 * POST /api/credentials — issue a credential for an artifact.
 */
export async function POST(request: NextRequest) {
  // Derive a rate-limit key from the request IP (permissionless — no sign-in required).
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous";

  // Rate limit: 5 requests per minute per IP
  if (!checkRateLimit(ip, 5, 60000)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data." },
      { status: 400 },
    );
  }

  const parsed = MetadataSchema.safeParse({
    provenance: form.get("provenance"),
    claim: form.get("claim"),
    model: form.get("model") || undefined,
    prompt: form.get("prompt") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Validation failed" },
      { status: 400 },
    );
  }

  const { provenance, claim, model, prompt } = parsed.data;
  const issuer = `anon:${ip}`;

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
    const safe = safeErrorMessage(error, "Failed to commit the credential to storage.");
    return NextResponse.json({ error: safe }, { status: 502 });
  }
}
