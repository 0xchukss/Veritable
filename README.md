# Veritable

Prove what is real in the AI age.

Veritable attaches cryptographically verifiable content credentials to AI
artifacts so anyone can confirm the exact artifact, its provenance, and the
0G transaction that anchors the credential.

## Architecture

- Next.js App Router for the product and public verification API.
- 0G Storage for encrypted credential storage and Merkle-proof downloads.
- 0G Compute for independently verified TEE-backed inference provenance.
- 0G Chain for storage transaction finality and proof-of-existence.
- Postgres + Prisma for the shareable credential index. The credential itself
  remains verifiable against 0G rather than trusting the index.

## Phase 2 verification

- Real forgery check: Veritable changes one decoded image pixel (or one byte
  for another artifact), hashes the forged file, and runs the normal verifier.
- Compute provenance: 0G Router runs with `verify_tee: true`. Veritable records
  the Router's verified TEE trace, checks the provider's on-chain model metadata
  with the official 0G Compute SDK, and binds both to the generated output hash.
- Public verification: `/verify/:credentialId` works without an account.
  Public responses expose an issuer fingerprint, not the raw issuer or prompt.
  Credential enumeration is disabled.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Enable real 0G

1. Create a Router API key at [0G Private Compute](https://pc.0g.ai).
2. Fund a Galileo testnet wallet for 0G Storage uploads.
3. Provision Postgres and configure `.env.local`:

```bash
DATABASE_URL=postgresql://...
VERITABLE_STORAGE_MODE=0g

ZERO_G_STORAGE_PRIVATE_KEY=0x...
ZERO_G_STORAGE_RPC_URL=https://evmrpc-testnet.0g.ai
ZERO_G_STORAGE_INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai
ZERO_G_CHAIN_EXPLORER_URL=https://chainscan-galileo.0g.ai
ZERO_G_CREDENTIAL_ENCRYPTION_KEY=0x...

ZERO_G_COMPUTE_API_KEY=sk-...
ZERO_G_COMPUTE_BASE_URL=https://router-api-testnet.integratenetwork.work/v1
ZERO_G_COMPUTE_MODEL=qwen/qwen2.5-omni-7b
ZERO_G_COMPUTE_RPC_URL=https://evmrpc-testnet.0g.ai

VERITABLE_RECEIPT_SECRET=...
```

`ZERO_G_CREDENTIAL_ENCRYPTION_KEY` and `VERITABLE_RECEIPT_SECRET` must be
separate random 32-byte secrets. Do not reuse the wallet private key.

## Verification

```bash
npm test
npx tsc --noEmit
npm run build
```
