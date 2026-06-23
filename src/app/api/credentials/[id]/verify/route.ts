import { NextResponse, type NextRequest } from "next/server";

import { safeErrorMessage } from "@/lib/veritable/errors";
import { getEnv } from "@/lib/veritable/env";
import { getCredential } from "@/lib/veritable/store";
import { verifyCredentialRequest } from "@/lib/veritable/verification-handler";

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
export async function POST(request: NextRequest, ctx: VerifyRouteContext) {
  const { id } = await ctx.params;
  try {
    const result = await verifyCredentialRequest(id, request);
    if (!result) {
      return NextResponse.json(
        { error: "No credential found with that id." },
        { status: 404 },
      );
    }
    return NextResponse.json(result);
  } catch (error) {
    const safe = safeErrorMessage(error, "Verification failed.");
    return NextResponse.json({ error: safe }, { status: 502 });
  }
}

/** Expose the configured storage mode so the UI can label local vs 0g. */
export async function GET(_request: NextRequest, ctx: VerifyRouteContext) {
  const { id } = await ctx.params;
  const stored = await getCredential(id);
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
