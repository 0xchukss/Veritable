import { NextResponse, type NextRequest } from "next/server";

import { getEnv } from "@/lib/veritable/env";
import { verify } from "@/lib/veritable/service";
import { getCredential } from "@/lib/veritable/store";

export const dynamic = "force-dynamic";

interface VerifyRouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/credentials/[id]/verify
 *
 * Re-verifies an issued credential against the 0G network: downloads the stored
 * credential with a Merkle proof, decrypts it, and confirms the artifact hash +
 * issuer match. This is the operation a third party would perform to check that
 * a credential has not been forged or altered — it trusts only 0G, not our DB.
 *
 * Returns the structured verification result.
 */
export async function POST(_request: NextRequest, ctx: VerifyRouteContext) {
  const { id } = await ctx.params;
  const stored = getCredential(id);
  if (!stored) {
    return NextResponse.json(
      { error: "No credential found with that id." },
      { status: 404 },
    );
  }

  const { credential, proof } = stored;
  try {
    const verification = await verify(
      proof,
      credential.issuer,
      credential.artifact.sha256,
    );
    return NextResponse.json({ verification, proof });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Verification failed.";
    return NextResponse.json(
      { error: message, proof },
      { status: 502 },
    );
  }
}

/** Expose the configured storage mode so the UI can label local vs 0g. */
export async function GET(_request: NextRequest, ctx: VerifyRouteContext) {
  const { id } = await ctx.params;
  const stored = getCredential(id);
  if (!stored) {
    return NextResponse.json(
      { error: "No credential found with that id." },
      { status: 404 },
    );
  }
  return NextResponse.json({
    storageMode: getEnv().VERITABLE_STORAGE_MODE,
    proof: stored.proof,
    credentialId: stored.credential.id,
  });
}
