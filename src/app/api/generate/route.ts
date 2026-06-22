import { NextResponse, type NextRequest } from "next/server";
import { getEnv } from "@/lib/veritable/env";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

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
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!res.ok) {
      throw new Error(`0G Compute API returned ${res.status}`);
    }

    const data = await res.json();
    const text = data.choices[0]?.message?.content || "";
    
    // The 0G Compute API returns an x_0g_trace object with the provider and request ID
    // We use this as our TEE Proof of computation provenance
    const trace = data.x_0g_trace || {};
    const teeProof = trace.request_id 
      ? `request_id:${trace.request_id};provider:${trace.provider}` 
      : `tx:${data.id}`;

    return NextResponse.json({
      text,
      model,
      teeProof
    });
  } catch (error: any) {
    console.error("0G Compute error:", error);
    return NextResponse.json({ error: "Failed to generate artifact." }, { status: 500 });
  }
}
