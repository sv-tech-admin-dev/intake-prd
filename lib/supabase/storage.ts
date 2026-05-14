import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

export type GeneratedDocumentArtifactKind = "markdown" | "pdf";

export function getGeneratedDocumentsBucketName() {
  return env.supabaseStorageBucket || "generated-documents";
}

export function buildGeneratedDocumentStorageKey(submissionId: string, documentId: string, kind: GeneratedDocumentArtifactKind) {
  return `generated-documents/${submissionId}/${documentId}/${kind}.${kind === "markdown" ? "md" : "pdf"}`;
}

export async function uploadGeneratedDocumentStorageObject(
  storageKey: string,
  body: Uint8Array | string,
  contentType: string
) {
  const client = createSupabaseAdminClient();
  const { error } = await client.storage.from(getGeneratedDocumentsBucketName()).upload(storageKey, body, {
    contentType,
    upsert: true,
  });

  if (error) throw error;
}

export async function downloadGeneratedDocumentStorageObject(storageKey: string) {
  const client = createSupabaseAdminClient();
  const { data, error } = await client.storage.from(getGeneratedDocumentsBucketName()).download(storageKey);
  if (error) throw error;
  if (!data) return null;

  const arrayBuffer = await data.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
