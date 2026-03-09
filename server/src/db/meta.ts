import { createHash, randomUUID } from "node:crypto";
import z from "zod";

export const documentMetaSchema = z.strictObject({
  id: z.uuid(),
  version: z.number().int().min(0),
  createdAt: z.string(),
  updatedAt: z.string(),
  salt: z.uuid(),
});
type DocumentMeta = z.infer<typeof documentMetaSchema>;

export function makeDocumentMeta(): DocumentMeta {
  const now = new Date().toISOString();
  return {
    id: makeId(),
    version: 0,
    createdAt: now,
    updatedAt: now,
    salt: makeSalt(),
  };
}

export function makeId(): string {
  return randomUUID().toString();
}

export function makeSalt(): string {
  return randomUUID().toString();
}

export function makeMetaHash(meta: DocumentMeta, context?: string): string {
  const base = context ? `${meta.updatedAt}:${context}` : meta.updatedAt;
  return `"${createHash("sha1").update(base).digest("base64")}"`;
}
