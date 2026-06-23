"use client";

import type { RefObject } from "react";

/**
 * Demo-safe 3D gate.
 *
 * The original WebGL scene is still in `logo-3d.tsx`, but loading it on the
 * landing page currently emits a Three.js dependency deprecation warning in
 * the console. For the hackathon submission path, Veritable keeps the stable
 * CSS gradient background and skips WebGL entirely.
 */
export function Logo3DClient({
  scrollRef,
}: {
  scrollRef: RefObject<number>;
}) {
  void scrollRef;
  return null;
}
