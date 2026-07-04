import type { Metadata } from "next";
import AdminUserList from "./_components/AdminUserList";

export const metadata: Metadata = {
  title: "User Directory — Admin",
  description:
    "View registered students and administrators, modify roles, and access controls.",
};

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">User Directory</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage user roles and administrative access.
        </p>
      </div>
      <AdminUserList />
    </div>
  );
}
