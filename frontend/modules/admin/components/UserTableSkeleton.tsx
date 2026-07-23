"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function UserTableSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="font-semibold text-foreground">User</TableHead>
            <TableHead className="font-semibold text-foreground">Role</TableHead>
            <TableHead className="font-semibold text-foreground">Joined</TableHead>
            <TableHead className="font-semibold text-foreground">Last Login</TableHead>
            <TableHead className="font-semibold text-foreground">Change Role</TableHead>
            <TableHead className="font-semibold text-foreground">Blocked</TableHead>
            <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: count }).map((_, i) => (
            <TableRow key={i}>
              {/* User info */}
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-28 rounded-md" />
                    <Skeleton className="h-3 w-40 rounded-md" />
                  </div>
                </div>
              </TableCell>
              {/* Role */}
              <TableCell>
                <Skeleton className="h-5 w-16 rounded-full" />
              </TableCell>
              {/* Joined */}
              <TableCell>
                <Skeleton className="h-3.5 w-20 rounded-md" />
              </TableCell>
              {/* Last Login */}
              <TableCell>
                <Skeleton className="h-3.5 w-24 rounded-md" />
              </TableCell>
              {/* Change Role */}
              <TableCell>
                <Skeleton className="h-8 w-28 rounded-md" />
              </TableCell>
              {/* Blocked toggle */}
              <TableCell>
                <Skeleton className="h-5 w-9 rounded-full" />
              </TableCell>
              {/* Actions */}
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default UserTableSkeleton;
