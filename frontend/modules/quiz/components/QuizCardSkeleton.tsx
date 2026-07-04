import React from "react";

interface QuizCardSkeletonProps {
  count?: number;
}

export default function QuizCardSkeleton({ count = 6 }: QuizCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="flex flex-col rounded-xl border border-border bg-card p-5 gap-4 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="h-5 w-24 bg-muted rounded-full" />
            <div className="h-5 w-16 bg-muted rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-6 w-3/4 bg-muted rounded" />
            <div className="h-4 w-5/6 bg-muted rounded" />
          </div>
          <div className="grid grid-cols-3 gap-2 bg-muted/30 p-3 rounded-lg border border-border/40">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
          <div className="flex gap-2 pt-2 border-t border-border/40 mt-auto">
            <div className="h-8 w-24 bg-muted rounded" />
            <div className="h-8 w-20 bg-muted rounded" />
          </div>
        </div>
      ))}
    </>
  );
}
