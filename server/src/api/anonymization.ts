/**
 * Utilities for anonymizing ids using salt stored with the game's metadata.
 */
import { createHash } from "node:crypto";
import type { Decision, Id } from "@server/types";

/******************************************************************************
 * ### anonymizeId
 ******************************************************************************/
export function anonymizeId(id: string, salt: string): string {
  const base = `${id}:${salt}`;
  const hash = createHash("sha256").update(base).digest("hex");

  // UUID version 4 consists of 32 hexadecimal digits in the form:
  // 8-4-4-4-12 (total 36 characters including hyphens)
  const uuid = [
    hash.substring(0, 8),
    hash.substring(8, 12),
    `4${hash.substring(12, 15)}`, // Set the version to 4
    `8${hash.substring(15, 18)}`, // Set the variant to 8 (RFC 4122)
    hash.substring(18, 30),
  ].join("-");

  return uuid;
}

/******************************************************************************
 * ### deanonymizeDecision
 *
 * Transforms a decision that may include anonymized values by replacing
 * anonymized values with the corresponding private data.
 ******************************************************************************/
export function deanonymizeDecision({
  decision,
  anonymizationSalt,
  playerIds,
}: {
  decision: Decision;
  anonymizationSalt: string;
  playerIds: Id[];
}): Decision {
  const valueMap: Record<Id, Id> = {};
  playerIds.forEach((id) => {
    valueMap[anonymizeId(id, anonymizationSalt)] = id;
  });
  return {
    ...decision,
    values: decision.values.map((v) => valueMap[v] ?? v),
  };
}
