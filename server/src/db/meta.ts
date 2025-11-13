import { createHash, randomUUID } from "crypto";
import z from "zod";

export const documentMetaSchema = z.strictObject({
  id: z.uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
  anonymizationSalt: z.uuid(),
});
type DocumentMeta = z.infer<typeof documentMetaSchema>;

export function makeDocumentMeta(): DocumentMeta {
  const now = new Date().toISOString();
  return {
    id: makeId(),
    createdAt: now,
    updatedAt: now,
    anonymizationSalt: makeSalt(),
  };
}

export function makeId(): string {
  return randomUUID().toString();
}

export function makeSalt(): string {
  return randomUUID().toString();
}

export function makeEtag(meta: DocumentMeta, context?: string): string {
  const base = context ? `${meta.updatedAt}:${context}` : meta.updatedAt;
  return `"${createHash("sha1").update(base).digest("base64")}"`;
}
