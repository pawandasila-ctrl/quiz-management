import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function QuizCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-xs overflow-hidden">
      {/* Category Badge & Status */}
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      {/* Title & Description */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-4/5 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-2/3 rounded-md" />
      </div>

      {/* Metadata Row */}
      <div className="pt-3 border-t border-border/60 space-y-2">
        <div className="flex justify-between items-center">
          <Skeleton className="h-3.5 w-20 rounded-md" />
          <Skeleton className="h-3.5 w-12 rounded-md" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-3.5 w-20 rounded-md" />
          <Skeleton className="h-3.5 w-14 rounded-md" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 mt-auto border-t border-border/60">
        <Skeleton className="h-9 flex-1 rounded-xl" />
        <Skeleton className="h-9 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

export function QuizGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <QuizCardSkeleton key={i} />
      ))}
    </div>
  );
}
