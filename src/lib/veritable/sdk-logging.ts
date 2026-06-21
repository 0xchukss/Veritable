import { AsyncLocalStorage } from "node:async_hooks";

/**
 * The 0G storage SDK prints upload options (including the AES key bytes) to
 * console.log during uploads. This request-scoped guard suppresses SDK logs for
 * the duration of an upload/download without muting unrelated application logs.
 *
 * This is the regression that leaked the encryption key to dev logs in the
 * prior prototype — ported forward so it cannot recur.
 */
const sdkLogContext = new AsyncLocalStorage<boolean>();
const originalConsoleLog = console.log.bind(console);
let installed = false;

export async function withoutSdkDebugLogs<T>(
  operation: () => Promise<T>,
): Promise<T> {
  installConsoleFilter();
  return sdkLogContext.run(true, operation);
}

function installConsoleFilter(): void {
  if (installed) return;
  installed = true;

  console.log = (...args: unknown[]) => {
    if (sdkLogContext.getStore()) {
      return;
    }
    originalConsoleLog(...args);
  };
}
