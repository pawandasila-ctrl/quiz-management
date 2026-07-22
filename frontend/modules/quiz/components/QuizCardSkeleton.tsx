import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function QuizCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-sm p-5 space-y-4 animate-pulse">
      {/* Category Badge & Status */}
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-24 rounded-md" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>

      {/* Title & Description */}
      <div className="space-y-2.5">
        <Skeleton className="h-5 w-3/4 rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-4/5 rounded-md" />
      </div>

      {/* Creator Info */}
      <div className="pt-2 border-t border-border/40 flex items-center justify-between">
        <Skeleton className="h-3 w-32 rounded-md" />
        <Skeleton className="h-3 w-20 rounded-md" />
      </div>

      {/* Stats Block */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-muted/40 rounded-lg border border-border/60">
        <div className="flex flex-col items-center gap-1">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-4 w-6" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-4 w-6" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-4 w-6" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-8 flex-1 rounded-md" />
        <Skeleton className="h-8 flex-1 rounded-md" />
      </div>
    </div>
  );
}

export function QuizGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <QuizCardSkeleton key={i} />
      ))}
    </div>
  );
}
