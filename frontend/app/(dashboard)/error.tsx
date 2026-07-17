"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an auditing service
    console.error("Dashboard route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="rounded-full bg-destructive/10 p-3 text-destructive">
        <AlertCircle className="h-8 w-8" />
      </div>
      
      <div className="space-y-1.5 max-w-md">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          An error occurred while loading this page. Please try reloading the component or contact support.
        </p>
      </div>

      <Button onClick={() => reset()} size="sm" className="gap-2 mt-2">
        <RotateCcw className="h-3.5 w-3.5" />
        Try Again
      </Button>
    </div>
  );
}
