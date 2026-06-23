import { describe, expect, it } from "vitest";

import {
  signComputeReceipt,
  verifyComputeReceipt,
  type ComputeReceipt,
} from "./compute-receipt";

const secret = "phase-two-test-secret-that-is-long-enough";

function receipt(overrides: Partial<ComputeReceipt> = {}): ComputeReceipt {
  return {
    version: 1,
    system: "0g-compute-router",
    network: "testnet",
    model: "qwen/qwen2.5-omni-7b",
    provider: "0x1111111111111111111111111111111111111111",
    requestId: "request-1",
    chatId: "chat-1",
    promptHash: "a".repeat(64),
    outputHash: "b".repeat(64),
    routerTeeVerified: true,
    independentlyVerified: true,
    modelVerified: true,
    verifiedAt: "2026-06-22T12:00:00.000Z",
    expiresAt: "2026-06-22T12:30:00.000Z",
    ...overrides,
  };
}

describe("0G Compute receipt", () => {
  it("round-trips a verified receipt", () => {
    const token = signComputeReceipt(receipt(), secret);
    const verified = verifyComputeReceipt(
      token,
      secret,
      new Date("2026-06-22T12:05:00.000Z"),
    );
    expect(verified.outputHash).toBe("b".repeat(64));
    expect(verified.independentlyVerified).toBe(true);
  });

  it("rejects a modified receipt", () => {
    const token = signComputeReceipt(receipt(), secret);
    const [payload, digest] = token.split(".");
    const changed = `${payload!.slice(0, -1)}A.${digest}`;
    expect(() =>
      verifyComputeReceipt(
        changed,
        secret,
        new Date("2026-06-22T12:05:00.000Z"),
      ),
    ).toThrow();
  });

  it("rejects an expired receipt", () => {
    const token = signComputeReceipt(receipt(), secret);
    expect(() =>
      verifyComputeReceipt(
        token,
        secret,
        new Date("2026-06-22T13:00:00.000Z"),
      ),
    ).toThrow("expired");
  });
});
