import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyQuizzesLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 px-1 py-2 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-4 w-80 rounded-md" />
        </div>
        <Skeleton className="h-9 w-44 rounded-xl shrink-0 mt-1" />
      </div>

      {/* Divider */}
      <div className="border-t border-border/60" />

      {/* Attempt Cards Group Skeleton */}
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, groupIdx) => (
          <div
            key={groupIdx}
            className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs space-y-0"
          >
            {/* Group Header Skeleton */}
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-44 rounded-md" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-24 rounded-full" />
            </div>

            {/* Attempt Rows Skeleton */}
            <div className="divide-y divide-border/60">
              {Array.from({ length: 2 }).map((_, rowIdx) => (
                <div
                  key={rowIdx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4"
                >
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-28 rounded-md" />
                        <Skeleton className="h-4 w-16 rounded-full" />
                      </div>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-3.5 w-24 rounded-md" />
                        <Skeleton className="h-3.5 w-16 rounded-md" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pl-10 sm:pl-0">
                    <div className="space-y-1 text-right">
                      <Skeleton className="h-5 w-16 rounded-md ml-auto" />
                      <Skeleton className="h-3 w-10 rounded-md ml-auto" />
                    </div>
                    <Skeleton className="h-8 w-28 rounded-xl shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
