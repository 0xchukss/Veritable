import "server-only";

import { z } from "zod";

const envSchema = z
  .object({
    VERITABLE_STORAGE_MODE: z.enum(["0g", "local"]).default("local"),
    VERITABLE_DATA_BACKEND: z.enum(["memory", "file"]).default("memory"),
    VERITABLE_DATA_FILE: z.string().default(".data/veritable.json"),
    ZERO_G_STORAGE_PRIVATE_KEY: z.string().optional(),
    ZERO_G_STORAGE_RPC_URL: z
      .string()
      .url()
      .default("https://evmrpc-testnet.0g.ai"),
    ZERO_G_STORAGE_INDEXER_URL: z
      .string()
      .url()
      .default("https://indexer-storage-testnet-turbo.0g.ai"),
    ZERO_G_CHAIN_EXPLORER_URL: z
      .string()
      .default("https://chainscan-newton.0g.ai"),
    ZERO_G_CREDENTIAL_ENCRYPTION_KEY: z.string().optional(),
    ZERO_G_COMPUTE_API_KEY: z.string().optional(),
    ZERO_G_COMPUTE_BASE_URL: z.string().optional(),
    ZERO_G_COMPUTE_MODEL: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.VERITABLE_STORAGE_MODE === "0g") {
      if (!env.ZERO_G_STORAGE_PRIVATE_KEY) {
        ctx.addIssue({
          code: "custom",
          message:
            "ZERO_G_STORAGE_PRIVATE_KEY is required when VERITABLE_STORAGE_MODE=0g",
          path: ["ZERO_G_STORAGE_PRIVATE_KEY"],
        });
      }
      if (!env.ZERO_G_CREDENTIAL_ENCRYPTION_KEY) {
        ctx.addIssue({
          code: "custom",
          message:
            "ZERO_G_CREDENTIAL_ENCRYPTION_KEY is required when VERITABLE_STORAGE_MODE=0g",
          path: ["ZERO_G_CREDENTIAL_ENCRYPTION_KEY"],
        });
      }
    }
  });

export type VeritableEnv = z.infer<typeof envSchema>;

let cachedEnv: VeritableEnv | null = null;

export function getEnv(): VeritableEnv {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(process.env);
  }
  return cachedEnv;
}
