"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DeleteDocumentButton({ documentId, documentLabel }: { documentId: string; documentLabel: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(`Delete ${documentLabel}? This removes the document and its stored artifacts.`);
    if (!confirmed) return;

    setIsPending(true);
    try {
      const response = await fetch(`/api/admin/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
      {isPending ? "Deleting..." : "Delete"}
    </Button>
  );
}
