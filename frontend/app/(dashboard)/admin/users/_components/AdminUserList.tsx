"use client";

import React from "react";
import { useAdminUsers } from "@/modules/admin/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import UserTable from "@/modules/admin/components/UserTable";

import { User } from "@/modules/auth/types";

interface AdminUserListProps {
  initialUsers?: User[];
}

export default function AdminUserList({ initialUsers }: AdminUserListProps) {
  const { data: users, isLoading: isUsersLoading } = useAdminUsers({
    initialData: initialUsers,
  });

  const isLoading = isUsersLoading && !users;

  if (isLoading) {
    return (
      <div className="space-y-3 p-4 border border-border rounded-xl bg-card">
        <Skeleton className="h-8 w-48 rounded-md mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-border/40">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-7 w-24 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  return <UserTable users={users || []} />;
}
