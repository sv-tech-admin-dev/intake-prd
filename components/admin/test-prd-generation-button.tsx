"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function TestPrdGenerationButton({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/intake/submissions/${submissionId}/generate-prd`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Test PRD generation failed");
      }

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={handleClick} disabled={loading}>
      {loading ? "Testing..." : "Test PRD Generation"}
    </Button>
  );
}
