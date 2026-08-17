"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeedbackPrintButton({ disabled }: { disabled?: boolean }) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={disabled}
      onClick={() => window.print()}
    >
      <Printer className="mr-1 h-4 w-4" />
      Cetak
    </Button>
  );
}
