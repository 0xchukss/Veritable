import { randomUUID } from "node:crypto";

import { sha256Hex } from "./crypto";
import type { Artifact, ArtifactKind } from "./types";

/** Map a content type to a categorical kind, defaulting to document. */
export function kindFromContentType(contentType: string): ArtifactKind {
  const ct = contentType.toLowerCase();
  if (ct.startsWith("image/")) return "image";
  if (ct.startsWith("text/")) return "text";
  if (ct.startsWith("audio/")) return "audio";
  if (ct.startsWith("video/")) return "video";
  return "document";
}

/** Build an Artifact descriptor from raw bytes + metadata. */
export function buildArtifact(
  bytes: Uint8Array,
  contentType: string,
  filename?: string,
): Artifact {
  return {
    id: randomUUID(),
    contentType,
    kind: kindFromContentType(contentType),
    filename,
    sha256: sha256Hex(bytes),
    byteLength: bytes.byteLength,
  };
}
