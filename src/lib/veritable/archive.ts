// Barrel for archive implementations. Importing this pulls in the 0G archive
// (which is "server-only"), so use ./local-archive directly in unit tests.
export type { CredentialArchive } from "./archive-contract";
export { LocalCredentialArchive } from "./local-archive";
export { ZeroGCredentialArchive } from "./zero-g-archive";
