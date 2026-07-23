import type { Metadata } from "next";
import AdminUserList from "./_components/AdminUserList";
import { serverFetch } from "@/lib/server-api";
import { User } from "@/modules/auth/types";
import { PaginatedResponse } from "@/modules/quiz/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "User Management — Admin",
  description: "Manage system accounts, assign roles, and modify permissions.",
};

export default async function AdminUsersPage() {
  const initialUsers = await serverFetch<PaginatedResponse<User>>("/admin/users?page=1&limit=10");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">User Management</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review system accounts, promote instructors, or grant administrative access.
        </p>
      </div>

      <AdminUserList initialUsers={initialUsers || undefined} />
    </div>
  );
}
