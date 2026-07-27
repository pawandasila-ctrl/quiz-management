import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { QuizGridSkeleton } from "@/modules/quiz/components/QuizCardSkeleton";

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Admin Hero Header Skeleton */}
      <Card className="rounded-3xl border border-border bg-card">
        <CardContent className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <Skeleton className="h-6 w-44 rounded-full" />
              <Skeleton className="h-8 w-3/4 rounded-xl" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-4/5 rounded-md" />
            </div>
            <Skeleton className="h-10 w-36 rounded-xl shrink-0" />
          </div>
        </CardContent>
      </Card>

      {/* Admin Filter Toolbar Skeleton */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Skeleton className="h-10 flex-1 max-w-md rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <QuizGridSkeleton count={6} />
    </div>
  );
}
