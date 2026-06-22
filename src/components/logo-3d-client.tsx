"use client";

import dynamic from "next/dynamic";

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
  return <Logo3DBrowser scrollRef={scrollRef} />;
}
