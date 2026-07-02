"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface ReviewHeaderProps {
  title: string;
  subtitle?: string;
  backUrl: string;
}

export default function ReviewHeader({ title, subtitle, backUrl }: ReviewHeaderProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(backUrl)}
        className="gap-1.5 border border-border bg-background hover:bg-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
