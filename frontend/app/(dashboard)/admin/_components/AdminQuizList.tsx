"use client";

import React, { useState } from "react";
import { useAdminQuizzes, useAdminCategories } from "@/modules/admin/hooks";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Loader2,
  Search,
  X,
  Filter,
  FolderOpen,
  RotateCcw,
} from "lucide-react";
import QuizCard from "@/modules/quiz/components/QuizCard";
import { QuizGridSkeleton } from "@/modules/quiz/components/QuizCardSkeleton";
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
import { Quiz, PaginatedResponse } from "@/modules/quiz/types";

interface AdminQuizListProps {
  initialQuizzes?: PaginatedResponse<Quiz> | Quiz[];
}

export default function AdminQuizList({ initialQuizzes }: AdminQuizListProps) {
  const { data: categories } = useAdminCategories();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [page, setPage] = useState<number>(1);

  // Debounce search input (300ms) for high UI responsiveness
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Event handlers to update filter state and reset page to 1
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setPage(1);
  };

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val);
    setPage(1);
  };

  const handleStatusChange = (val: string) => {
    setSelectedStatus(val);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setPage(1);
  };

  // Convert selectedCategory string to numeric ID directly
  const categoryId =
    selectedCategory !== "all" && !isNaN(Number(selectedCategory))
      ? Number(selectedCategory)
      : undefined;

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    selectedCategory !== "all" ||
    selectedStatus !== "all";

  const isDefaultState = !hasActiveFilters && page === 1;

  // Format initialData if passed from RSC
  const formattedInitialData: PaginatedResponse<Quiz> | undefined =
    React.useMemo(() => {
      if (!initialQuizzes) return undefined;
      if (Array.isArray(initialQuizzes)) {
        return {
          items: initialQuizzes,
          total: initialQuizzes.length,
          page: 1,
          limit: 9,
          pages: 1,
        };
      }
      return initialQuizzes;
    }, [initialQuizzes]);

  // Server-side API fetching with params & pagination
  const {
    data: quizData,
    isLoading: isQuizzesLoading,
    isFetching,
  } = useAdminQuizzes(
    {
      search: debouncedSearch.trim() || undefined,
      category_id: categoryId,
      status: selectedStatus !== "all" ? selectedStatus : undefined,
      page,
      limit: 9,
    },
    {
      initialData: isDefaultState ? formattedInitialData : undefined,
    },
  );

  const quizzes = quizData?.items || [];
  const total = quizData?.total || 0;
  const totalPages = quizData?.pages || 1;

  const isLoading = isQuizzesLoading && !quizData;

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by quiz title, description or creator..."
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

        {/* Shadcn Select Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Category Dropdown */}
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full sm:w-42.5 h-9 text-xs bg-card border-border shadow-xs hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-1.5 truncate">
                <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="All Categories" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Dropdown */}
          <Select value={selectedStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-35 h-9 text-xs bg-card border-border shadow-xs hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-1.5 truncate">
                <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="All Statuses" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filters Button */}
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

      {/* Filter & Pagination Info Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-2">
          <span>
            Showing{" "}
            <strong className="text-foreground">
              {isLoading || isFetching ? "..." : quizzes.length}
            </strong>{" "}
            of <strong className="text-foreground">{total}</strong> total quizzes
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

      {/* Quiz Grid or Skeleton UI */}
      {isLoading || (isFetching && quizzes.length === 0) ? (
        <QuizGridSkeleton count={6} />
      ) : quizzes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-card/50">
          <Filter className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="font-semibold text-foreground">
            {hasActiveFilters
              ? "No quizzes match your filter criteria."
              : "No quizzes created yet."}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {hasActiveFilters
              ? "Try adjusting your search terms or clearing selected dropdown filters."
              : "Click 'Create Quiz' above to build your first exam."}
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
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}

      {/* Shadcn Pagination Bar */}
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
                ),
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
