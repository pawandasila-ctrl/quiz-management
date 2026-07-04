"use client";

import React from "react";
import { useAdminUsers } from "@/modules/quiz/hooks";
import { Loader2 } from "lucide-react";
import UserTable from "@/modules/admin/components/UserTable";

export default function AdminUserList() {
  const { data: users, isLoading } = useAdminUsers();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <UserTable users={users || []} />;
}
