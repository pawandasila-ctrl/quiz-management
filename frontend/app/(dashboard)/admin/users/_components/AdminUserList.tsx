"use client";

import React from "react";
import { useAdminUsers } from "@/modules/quiz/hooks";
import { Loader2 } from "lucide-react";
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
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <UserTable users={users || []} />;
}
