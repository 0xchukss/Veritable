const { PrismaClient } = require('@prisma/client');
const { MemData } = require('@0gfoundation/0g-storage-ts-sdk');

const prisma = new PrismaClient();

async function run() {
  const latest = await prisma.credential.findFirst({
    orderBy: { issuedAt: 'desc' }
  });
  console.log("Latest Credential ID:", latest.id);
  console.log("Root Hash:", latest.rootHash);
  console.log("Tx Hash:", latest.transactionHash);

  // We need to fetch this from 0g network to see why it fails
  // Let's also print the exact credential JSON that would be rebuilt
  const rebuilt = {
    schema: latest.schema,
    id: latest.id,
    artifact: {
      id: latest.artifactId,
      contentType: latest.contentType,
      kind: latest.kind,
      filename: latest.filename ?? undefined,
      sha256: latest.sha256,
      byteLength: latest.byteLength,
    },
    issuer: latest.issuer,
    issuerHash: latest.issuerHash ?? undefined,
    provenance: latest.provenance,
    claim: latest.claim,
    model: latest.model ?? undefined,
    prompt: latest.prompt ?? undefined,
    teeProof: latest.teeProof ?? undefined,
    issuedAt: latest.issuedAt.toISOString(),
  };

  const jsonString = JSON.stringify(rebuilt);
  console.log("Rebuilt JSON:", jsonString);
  const file = new MemData(new TextEncoder().encode(jsonString));
  const [tree] = await file.merkleTree();
  console.log("Rebuilt Merkle Root:", tree.rootHash());
  console.log("Matches DB Root Hash?", tree.rootHash() === latest.rootHash);

  await prisma.$disconnect();
}

run().catch(console.error);
