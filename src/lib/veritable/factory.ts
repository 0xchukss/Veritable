import "server-only";

import path from "node:path";

import {
  LocalCredentialArchive,
  ZeroGCredentialArchive,
  type CredentialArchive,
} from "./archive";
import { getEnv } from "./env";

/**
 * Build the credential archive based on configured mode. In local mode it writes
 * to disk so the full create/verify loop works without testnet funds; in 0g
 * mode it commits to the real 0G Storage network.
 */
export function getArchive(): CredentialArchive {
  const env = getEnv();
  if (env.VERITABLE_STORAGE_MODE === "0g") {
    return new ZeroGCredentialArchive({
      privateKey: env.ZERO_G_STORAGE_PRIVATE_KEY!,
      encryptionKey: env.ZERO_G_CREDENTIAL_ENCRYPTION_KEY!,
      rpcUrl: env.ZERO_G_STORAGE_RPC_URL,
      indexerUrl: env.ZERO_G_STORAGE_INDEXER_URL,
      explorerUrl: env.ZERO_G_CHAIN_EXPLORER_URL,
    });
  }
  return new LocalCredentialArchive(
    path.join(process.cwd(), ".data", "credentials"),
  );
}
