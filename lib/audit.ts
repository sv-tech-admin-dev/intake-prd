import type { AuditLogEntry } from "./intake/types";

export function makeAuditEntry(partial: Omit<AuditLogEntry, "id" | "createdAt">): AuditLogEntry {
  return {
    ...partial,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
}
