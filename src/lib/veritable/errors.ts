/**
 * Map raw 0G/ethers/SDK errors to safe, user-facing messages.
 *
 * Raw upstream errors can leak internal detail (RPC URLs, partial stack info,
 * wallet state). Never surface them verbatim — route through here first.
 */
export function sanitizeStorageError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("insufficient funds") || lower.includes("gas")) {
    return "The storage wallet has insufficient funds. Contact the operator.";
  }
  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "The storage network timed out. Please try again.";
  }
  if (lower.includes("network") || lower.includes("rpc") || lower.includes("disconnected")) {
    return "Could not reach the storage network. Please try again.";
  }
  if (lower.includes("not found") || lower.includes("does not include")) {
    return "The stored credential could not be found on the network.";
  }
  return "Failed to commit the credential to storage. Please try again.";
}

/** Extract a message from an unknown catch and sanitize it. */
export function safeErrorMessage(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : "";
  return raw ? sanitizeStorageError(raw) : fallback;
}
