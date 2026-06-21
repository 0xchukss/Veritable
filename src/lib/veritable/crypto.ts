import { createHash, createHmac } from "node:crypto";
import { ethers } from "ethers";

/**
 * Per-issuer AES key derivation. Different issuers get different encryption keys
 * derived from one master key, so one user's stored credentials cannot be
 * decrypted with another's key — even though all ciphertexts sit on public 0G
 * Storage.
 */
export function deriveIssuerEncryptionKey(
  masterKey: string,
  issuerId: string,
): Uint8Array {
  const key = parseEncryptionKey(masterKey);
  return new Uint8Array(
    createHmac("sha256", key)
      .update(`veritable-issuer-v1:${issuerId}`)
      .digest(),
  );
}

/** SHA-256 of the issuer id, for embedding (hashed) inside the encrypted bundle. */
export function hashIssuer(issuerId: string): string {
  return createHash("sha256").update(`veritable-issuer-v1:${issuerId}`).digest("hex");
}

/** SHA-256 of arbitrary bytes (an artifact), returned as hex without 0x. */
export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** Parse a 32-byte hex master key into bytes, validating length. */
export function parseEncryptionKey(value: string): Uint8Array {
  const normalized = value.startsWith("0x") ? value.slice(2) : value;
  if (!/^[0-9a-f]{64}$/i.test(normalized)) {
    throw new Error(
      "ZERO_G_CREDENTIAL_ENCRYPTION_KEY must be a 32-byte hex value.",
    );
  }
  return ethers.getBytes(`0x${normalized}`);
}
