"use client";

import React, { useState } from "react";
import { useAdminUsers } from "@/modules/admin/hooks";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Loader2,
  Search,
  X,
  Filter,
  UserCheck,
  RotateCcw,
} from "lucide-react";
import UserTable from "@/modules/admin/components/UserTable";
import UserTableSkeleton from "@/modules/admin/components/UserTableSkeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { User, UserRole } from "@/modules/auth/types";
import { PaginatedResponse } from "@/modules/quiz/types";

interface AdminUserListProps {
  initialUsers?: PaginatedResponse<User> | User[];
}

export default function AdminUserList({ initialUsers }: AdminUserListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [page, setPage] = useState<number>(1);

  // 300ms search input debouncing
  const debouncedSearch = useDebounce(searchTerm, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setPage(1);
  };

  const handleRoleChange = (val: string) => {
    setSelectedRole(val);
    setPage(1);
  };

  const handleStatusChange = (val: string) => {
    setSelectedStatus(val);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedRole("all");
    setSelectedStatus("all");
    setPage(1);
  };

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    selectedRole !== "all" ||
    selectedStatus !== "all";

  const isDefaultState = !hasActiveFilters && page === 1;

  // Format initialData if array or PaginatedResponse
  const formattedInitialData: PaginatedResponse<User> | undefined =
    React.useMemo(() => {
      if (!initialUsers) return undefined;
      if (Array.isArray(initialUsers)) {
        return {
          items: initialUsers,
          total: initialUsers.length,
          page: 1,
          limit: 10,
          pages: 1,
        };
      }
      return initialUsers;
    }, [initialUsers]);

  const isBlockedFilter =
    selectedStatus === "active"
      ? true
      : selectedStatus === "blocked"
      ? false
      : undefined;

  // Fetch paginated user data
  const {
    data: userData,
    isLoading: isUsersLoading,
    isFetching,
  } = useAdminUsers(
    {
      search: debouncedSearch.trim() || undefined,
      role: selectedRole !== "all" ? (selectedRole as UserRole) : undefined,
      is_active: isBlockedFilter,
      page,
      limit: 10,
    },
    {
      initialData: isDefaultState ? formattedInitialData : undefined,
    }
  );

  const users = userData?.items || [];
  const total = userData?.total || 0;
  const totalPages = userData?.pages || 1;

  const isLoading = isUsersLoading && !userData;

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search users by name or email address..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-9 pr-8 h-9 text-xs bg-card border-border shadow-xs hover:border-primary/40 focus:border-primary transition-colors"
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-accent"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Role Filter */}
          <Select value={selectedRole} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-full sm:w-36 h-9 text-xs bg-card border-border shadow-xs hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-1.5 truncate">
                <UserCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="All Roles" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="instructor">Instructor</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={selectedStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-36 h-9 text-xs bg-card border-border shadow-xs hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-1.5 truncate">
                <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="All Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="blocked">Blocked Only</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 text-xs gap-1.5 px-3 border-border hover:bg-accent text-muted-foreground hover:text-foreground shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Info Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-2">
          <span>
            Showing{" "}
            <strong className="text-foreground">
              {isLoading || isFetching ? "..." : users.length}
            </strong>{" "}
            of <strong className="text-foreground">{total}</strong> total users
          </span>
          {hasActiveFilters && (
            <Badge
              variant="secondary"
              className="text-[10px] px-2 py-0 font-normal"
            >
              Filtered
            </Badge>
          )}
          {isFetching && (
            <Loader2 className="h-3 w-3 animate-spin text-primary ml-1" />
          )}
        </div>
        {totalPages > 1 && (
          <span className="text-[11px] font-medium">
            Page {page} of {totalPages}
          </span>
        )}
      </div>

      {/* Content or Table Skeleton */}
      {isLoading || (isFetching && users.length === 0) ? (
        <UserTableSkeleton count={8} />
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-card/50">
          <Filter className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="font-semibold text-foreground">
            {hasActiveFilters
              ? "No users match your search and filter criteria."
              : "No users found."}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {hasActiveFilters
              ? "Try adjusting your search query or resetting dropdown filters."
              : "System accounts will appear here."}
          </p>
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetFilters}
              className="mt-4 text-xs gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear Filters</span>
            </Button>
          )}
        </div>
      ) : (
        <UserTable users={users} />
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="pt-4 border-t border-border/60">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className={
                    page <= 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <PaginationItem key={pageNum}>
                    <Button
                      size="sm"
                      variant={pageNum === page ? "default" : "outline"}
                      onClick={() => setPage(pageNum)}
                      className="h-8 w-8 p-0 text-xs font-medium"
                    >
                      {pageNum}
                    </Button>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  className={
                    page >= totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
