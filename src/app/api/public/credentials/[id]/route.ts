import { NextResponse, type NextRequest } from "next/server";

import { safeErrorMessage } from "@/lib/veritable/errors";
import { toPublicIssuedCredential } from "@/lib/veritable/public-credential";
import { checkRateLimit } from "@/lib/veritable/rate-limit";
import { getCredential } from "@/lib/veritable/store";
import { verifyCredentialRequest } from "@/lib/veritable/verification-handler";

export const dynamic = "force-dynamic";

interface PublicCredentialRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  ctx: PublicCredentialRouteContext,
) {
  const { id } = await ctx.params;
  try {
    const stored = await getCredential(id);
    if (!stored) {
      return NextResponse.json(
        { error: "Credential not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(toPublicIssuedCredential(stored), {
      headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("Public credential lookup failed:", error);
    return NextResponse.json(
      { error: "The credential index is temporarily unavailable." },
      { status: 503 },
    );
  }
}

export async function POST(
  request: NextRequest,
  ctx: PublicCredentialRouteContext,
) {
  const { id } = await ctx.params;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous";
  if (!checkRateLimit(`public-verify:${ip}`, 20, 60_000)) {
    return NextResponse.json(
      { error: "Too many verification requests. Please try again shortly." },
      { status: 429 },
    );
  }

  try {
    const result = await verifyCredentialRequest(id, request);
    if (!result) {
      return NextResponse.json(
        { error: "Credential not found." },
        { status: 404 },
      );
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: safeErrorMessage(error, "Verification failed.") },
      { status: 502 },
    );
  }
}
