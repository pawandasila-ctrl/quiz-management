"use client";

import React from "react";
import { useAdminUsers } from "@/models/quiz/hooks";
import { Loader2 } from "lucide-react";
import UserTable from "@/components/admin/UserTable";

export default function UserManagementPage() {
  const { data: users, isLoading } = useAdminUsers();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">User Directory</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage user roles and administrative access.
        </p>
      </div>
      <UserTable users={users || []} />
    </div>
  );
}
