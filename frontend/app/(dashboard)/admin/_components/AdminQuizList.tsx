"use client";

import React, { useState, useMemo } from "react";
import { useAdminQuizzes, useAdminCategories } from "@/modules/quiz/hooks";
import { useDebounce } from "@/hooks/use-debounce";
import { Loader2, Plus, Search, X, Filter } from "lucide-react";
import QuizCard from "@/modules/quiz/components/QuizCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Quiz } from "@/modules/quiz/types";

interface AdminQuizListProps {
  initialQuizzes?: Quiz[];
}

export default function AdminQuizList({ initialQuizzes }: AdminQuizListProps) {
  const { data: quizzes, isLoading: isQuizzesLoading } = useAdminQuizzes({
    initialData: initialQuizzes,
  });
  const { data: categories } = useAdminCategories();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Debounce search input (300ms) for high UI responsiveness
  const debouncedSearch = useDebounce(searchTerm, 300);

  const isLoading = isQuizzesLoading && !quizzes;

  // Filtered Quizzes memoized for high performance
  const filteredQuizzes = useMemo(() => {
    if (!quizzes) return [];

    return quizzes.filter((quiz) => {
      // 1. Search filter (Title, Description, Creator Name)
      if (debouncedSearch.trim()) {
        const query = debouncedSearch.toLowerCase().trim();
        const matchesTitle = quiz.title.toLowerCase().includes(query);
        const matchesDesc = quiz.description?.toLowerCase().includes(query) ?? false;
        const matchesCreator = quiz.creator?.name.toLowerCase().includes(query) ?? false;
        if (!matchesTitle && !matchesDesc && !matchesCreator) {
          return false;
        }
      }

      // 2. Category filter
      if (selectedCategory !== "all") {
        if (quiz.category?.name !== selectedCategory) {
          return false;
        }
      }

      // 3. Status filter
      if (selectedStatus !== "all") {
        if (quiz.status !== selectedStatus) {
          return false;
        }
      }

      return true;
    });
  }, [quizzes, debouncedSearch, selectedCategory, selectedStatus]);

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    selectedCategory !== "all" ||
    selectedStatus !== "all";

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedStatus("all");
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-muted/20">
        <Plus className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No quizzes created yet.</p>
        <p className="mt-1">Click &quot;Create Quiz&quot; to build your first exam.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-card border border-border rounded-xl shadow-sm">
        {/* Search Bar with Debounce */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search quizzes by title, description or creator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-8 h-9 text-sm border-border bg-background"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category & Status Filters */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1 px-2.5"
            >
              <X className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Active Filter Counter */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            Showing <strong className="text-foreground">{filteredQuizzes.length}</strong> of{" "}
            <strong className="text-foreground">{quizzes.length}</strong> quizzes
          </span>
        </div>
      )}

      {/* Quiz Grid */}
      {filteredQuizzes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-card">
          <Filter className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="font-semibold text-foreground">No quizzes match your filter criteria.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search terms or clearing selected dropdown filters.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetFilters}
            className="mt-4 text-xs"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredQuizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}
    </div>
  );
}
