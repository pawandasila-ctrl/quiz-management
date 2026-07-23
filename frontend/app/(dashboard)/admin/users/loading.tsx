import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import UserTableSkeleton from "@/modules/admin/components/UserTableSkeleton";

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <Skeleton className="h-7 w-48 rounded-md" />
        <Skeleton className="h-4 w-96 rounded-md mt-2" />
      </div>

      {/* Toolbar skeleton */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Skeleton className="h-9 flex-1 rounded-md" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* Table Skeleton */}
      <UserTableSkeleton count={8} />
    </div>
  );
}
