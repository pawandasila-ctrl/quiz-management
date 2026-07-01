"use client";

import React, { useCallback } from "react";
import { useUpdateUserRole } from "@/models/quiz/hooks";
import { User, UserRole } from "@/models/auth/types";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface UserTableProps {
  users: User[];
}

function UserRow({ user }: { user: User }) {
  const updateRoleMutation = useUpdateUserRole();

  const handleRoleChange = useCallback(
    (role: string) => {
      updateRoleMutation.mutate(
        { userId: user.id, role: role as UserRole },
        {
          onSuccess: () =>
            toast.success(`Role updated to "${role}" for ${user.name}.`),
          onError: (err) => toast.error(err.message || "Failed to update role."),
        }
      );
    },
    [updateRoleMutation, user.id, user.name]
  );

  return (
    <TableRow>
      <TableCell className="font-medium text-foreground">{user.name}</TableCell>
      <TableCell className="text-muted-foreground">{user.email}</TableCell>
      <TableCell>
        <Badge
          variant={user.role === "admin" ? "default" : "outline"}
          className="capitalize"
        >
          {user.role}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <Select
          value={user.role}
          onValueChange={handleRoleChange}
          disabled={updateRoleMutation.isPending}
        >
          <SelectTrigger className="h-8 w-[120px] text-xs ml-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  );
}

export default function UserTable({ users }: UserTableProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="font-semibold text-foreground">Name</TableHead>
            <TableHead className="font-semibold text-foreground">Email</TableHead>
            <TableHead className="font-semibold text-foreground">Current Role</TableHead>
            <TableHead className="font-semibold text-foreground text-right">
              Change Role
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground py-10"
              >
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            users.map((u) => <UserRow key={u.id} user={u} />)
          )}
        </TableBody>
      </Table>
    </div>
  );
}
