import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";

export const ComputeReceiptSchema = z.object({
  version: z.literal(1),
  system: z.literal("0g-compute-router"),
  network: z.enum(["mainnet", "testnet"]),
  model: z.string().min(1).max(200),
  responseModel: z.string().min(1).max(200).optional(),
  provider: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  requestId: z.string().min(1).max(200),
  chatId: z.string().min(1).max(300),
  promptHash: z.string().regex(/^[0-9a-f]{64}$/),
  outputHash: z.string().regex(/^[0-9a-f]{64}$/),
  routerTeeVerified: z.literal(true),
  independentlyVerified: z.boolean(),
  modelVerified: z.literal(true),
  verifiedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

export type ComputeReceipt = z.infer<typeof ComputeReceiptSchema>;

function signature(payload: string, secret: string): Buffer {
  return createHmac("sha256", secret)
    .update("veritable-compute-receipt-v1:")
    .update(payload)
    .digest();
}

export function signComputeReceipt(
  receipt: ComputeReceipt,
  secret: string,
): string {
  const validated = ComputeReceiptSchema.parse(receipt);
  const payload = Buffer.from(JSON.stringify(validated)).toString("base64url");
  const digest = signature(payload, secret).toString("base64url");
  return `${payload}.${digest}`;
}

export function verifyComputeReceipt(
  token: string,
  secret: string,
  now = new Date(),
): ComputeReceipt {
  const [payload, providedDigest, extra] = token.split(".");
  if (!payload || !providedDigest || extra) {
    throw new Error("Invalid 0G Compute receipt.");
  }

  const actual = signature(payload, secret);
  const provided = Buffer.from(providedDigest, "base64url");
  if (
    actual.byteLength !== provided.byteLength ||
    !timingSafeEqual(actual, provided)
  ) {
    throw new Error("The 0G Compute receipt signature is invalid.");
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw new Error("The 0G Compute receipt payload is invalid.");
  }

  const receipt = ComputeReceiptSchema.parse(decoded);
  if (new Date(receipt.expiresAt).getTime() <= now.getTime()) {
    throw new Error("The 0G Compute receipt has expired. Generate again.");
  }
  return receipt;
}
