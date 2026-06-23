import "server-only";

import { getComputeRpcUrl } from "./env";

export type IndependentComputeVerification = {
  providerModel: string | null;
  modelVerified: boolean;
};

/**
 * Reads the selected provider's service record from the 0G Compute contract.
 * Router response IDs are not direct-provider chat IDs, so their signatures
 * cannot be replayed through `processResponse`; the Router's `tee_verified`
 * result remains the TEE attestation for Router-generated artifacts.
 */
export async function verifyComputeProvider(
  providerAddress: string,
  expectedModel: string,
): Promise<IndependentComputeVerification> {
  const [{ createZGComputeNetworkBroker }, { JsonRpcProvider, Wallet }] =
    await Promise.all([
      import("@0gfoundation/0g-compute-ts-sdk"),
      import("ethers"),
    ]);

  const provider = new JsonRpcProvider(getComputeRpcUrl());
  try {
    const wallet = new Wallet(Wallet.createRandom().privateKey, provider);
    const broker = await createZGComputeNetworkBroker(wallet);
    const metadata =
      await broker.inference.getServiceMetadata(providerAddress);
    const providerModel = metadata.model || null;

    return {
      providerModel,
      modelVerified:
        Boolean(providerModel) &&
        normalizeModel(providerModel!) === normalizeModel(expectedModel),
    };
  } finally {
    provider.destroy();
  }
}

function normalizeModel(model: string): string {
  return model
    .toLowerCase()
    .split("/")
    .at(-1)!
    .replace(/-\d+(?:\.\d+)?[bm]$/i, "");
}
