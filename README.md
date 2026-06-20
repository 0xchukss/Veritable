# Veritable

Prove what's real in the AI age.

Veritable attaches cryptographically verifiable content credentials to any AI
artifact — an image, a voice clip, a document — so anyone can independently
confirm *what* it is, *which model* produced it, and *when* it was registered.
The trust root lives on the 0G network, not on any single company's server.

This repository was reset from an earlier prototype. The 0G plumbing (storage
upload, Merkle-proof verification, owner-scoped encryption) is being rebuilt as
a general-purpose provenance layer.

## Architecture

- **Next.js App Router** for the product and server API.
- **0G Storage** for immutable artifact + credential storage, verified by Merkle proof.
- **0G Compute** for verifiable / TEE-backed inference provenance.
- **0G Chain** for the credential registry (proof-of-existence).
- **Optional Clerk identity** for user accounts.

## Run locally

```bash
cp .env.example .env.local
npm run dev
```

## Enable real 0G

1. Create and fund a Router API key at [0G Private Compute](https://pc.0g.ai).
2. Fund a Galileo testnet wallet for Storage uploads.
3. Set the following values in `.env.local`:

```bash
ZERO_G_COMPUTE_API_KEY=sk-...
ZERO_G_STORAGE_PRIVATE_KEY=0x...
ZERO_G_STORAGE_RPC_URL=...
ZERO_G_STORAGE_INDEXER_URL=...
ZERO_G_STORAGE_EXPLORER_URL=...
ZERO_G_MEMORY_ENCRYPTION_KEY=0x...
```

`ZERO_G_MEMORY_ENCRYPTION_KEY` must be a separate 32-byte hex key. Do not reuse
the wallet private key.

> Note: this key should be rotated before any deployment — it previously
> appeared in local development logs in the prior prototype.

## Verification

```bash
npm test
npm run lint
npm run build
```
