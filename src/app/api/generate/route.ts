import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { sha256Hex } from "@/lib/veritable/crypto";
import {
  signComputeReceipt,
  type ComputeReceipt,
} from "@/lib/veritable/compute-receipt";
import { verifyComputeProvider } from "@/lib/veritable/compute-verification";
import {
  getComputeNetwork,
  getEnv,
  getReceiptSecret,
} from "@/lib/veritable/env";
import { checkRateLimit } from "@/lib/veritable/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GenerateSchema = z.object({
  prompt: z.string().trim().min(1).max(4_000),
});

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      request.headers.get("x-real-ip") ??
      "anonymous";
    if (!checkRateLimit(`compute:${ip}`, 5, 60_000)) {
      return NextResponse.json(
        { error: "Too many generation requests. Please try again shortly." },
        { status: 429 },
      );
    }

    const parsed = GenerateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Prompt is required." },
        { status: 400 },
      );
    }
    const { prompt } = parsed.data;

    const env = getEnv();
    const apiKey = env.ZERO_G_COMPUTE_API_KEY;
    const baseUrl = env.ZERO_G_COMPUTE_BASE_URL;
    const model = env.ZERO_G_COMPUTE_MODEL || "qwen/qwen2.5-omni-7b";

    if (!apiKey || !baseUrl) {
      return NextResponse.json({ error: "0G Compute is not configured." }, { status: 501 });
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "X-0G-Provider-Trust-Mode": "verified",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        verify_tee: true,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(
        `0G Compute API returned ${res.status}: ${detail.slice(0, 300)}`,
      );
    }

    const data = await res.json();
    const text = data.choices[0]?.message?.content || "";
    if (!text) {
      throw new Error("0G Compute returned an empty artifact.");
    }

    const trace = data.x_0g_trace || {};
    const provider = String(trace.provider ?? "");
    const requestId = String(trace.request_id ?? "");
    const chatId =
      res.headers.get("ZG-Res-Key") ||
      res.headers.get("zg-res-key") ||
      String(data.id ?? requestId);
    const responseModel = String(data.model ?? model);

    if (!provider || !requestId || !chatId || trace.tee_verified !== true) {
      throw new Error(
        "0G did not return a complete, verified TEE trace for this generation.",
      );
    }

    const providerVerification = await verifyComputeProvider(
      provider,
      responseModel,
    );
    if (!providerVerification.modelVerified) {
      throw new Error(
        "The Router model did not match the provider's on-chain service record.",
      );
    }

    const now = new Date();
    const receipt: ComputeReceipt = {
      version: 1,
      system: "0g-compute-router",
      network: getComputeNetwork(),
      model: providerVerification.providerModel ?? responseModel,
      responseModel,
      provider,
      requestId,
      chatId,
      promptHash: sha256Hex(new TextEncoder().encode(prompt)),
      outputHash: sha256Hex(new TextEncoder().encode(text)),
      routerTeeVerified: true,
      independentlyVerified: false,
      modelVerified: true,
      verifiedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 30 * 60_000).toISOString(),
    };
    const computeReceipt = signComputeReceipt(receipt, getReceiptSecret());

    return NextResponse.json({
      text,
      model: receipt.model,
      teeProof: `request_id:${requestId};provider:${provider};chat_id:${chatId}`,
      provenance: receipt,
      computeReceipt,
    });
  } catch (error) {
    console.error("0G Compute error:", error);
    return NextResponse.json(
      { error: "0G Compute generation or proof verification failed. Please try again." },
      { status: 502 },
    );
  }
}
