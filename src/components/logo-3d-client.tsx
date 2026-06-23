"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

/**
 * SSR-safe wrapper for the 3D logo.
 *
 * The WebGL scene (logo-3d.tsx) cannot run during server-side rendering —
 * postprocessing tries to read GL state that doesn't exist on the server.
 * next/dynamic with ssr:false defers the entire scene to the browser.
 */
const Logo3DBrowser = dynamic(
  () => import("./logo-3d").then((m) => m.Logo3D),
  {
    ssr: false,
    loading: () => null,
  },
);

export function Logo3DClient({
  scrollRef,
}: {
  scrollRef: React.RefObject<number>;
}) {
  const shouldSkipWebGl = useSyncExternalStore(
    subscribeToLightweightMode,
    getLightweightMode,
    () => true,
  );

  if (shouldSkipWebGl) return null;

  return <Logo3DBrowser scrollRef={scrollRef} />;
}

const LIGHTWEIGHT_QUERY = "(prefers-reduced-motion: reduce), (max-width: 640px)";

function subscribeToLightweightMode(onStoreChange: () => void) {
  const media = window.matchMedia(LIGHTWEIGHT_QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getLightweightMode() {
  return window.matchMedia(LIGHTWEIGHT_QUERY).matches;
}
