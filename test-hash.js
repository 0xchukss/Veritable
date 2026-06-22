const { MemData } = require("@0gfoundation/0g-storage-ts-sdk");

async function run() {
  const file = new MemData(new TextEncoder().encode(JSON.stringify({hello: "world"})));
  const [tree, err] = await file.merkleTree();
  console.log("tree.rootHash():", tree.rootHash());
}

run().catch(console.error);
