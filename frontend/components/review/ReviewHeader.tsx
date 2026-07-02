import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ReviewHeaderProps {
  title: string;
  subtitle?: string;
  backUrl: string;
}

export default function ReviewHeader({ title, subtitle, backUrl }: ReviewHeaderProps) {
  return (
    <div className="space-y-4">
      <Link
        href={backUrl}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm hover:bg-accent transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
