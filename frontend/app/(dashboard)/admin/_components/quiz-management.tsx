"use client";

import React, { useState } from "react";
import { useAdminQuizzes, useAdminCategories } from "@/models/quiz/hooks";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuizCard from "@/components/admin/quiz/QuizCard";
import CreateQuizModal from "@/components/admin/quiz/CreateQuizModal";

export default function QuizManagementPage() {
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);

  const { data: quizzes, isLoading: isQuizzesLoading } = useAdminQuizzes();
  const { data: categories, isLoading: isCategoriesLoading } = useAdminCategories();

  if (isQuizzesLoading || isCategoriesLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Quiz Library</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your exam papers and published results.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreateQuiz(!showCreateQuiz)}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" /> Create Quiz
        </Button>
      </div>

      {showCreateQuiz && (
        <CreateQuizModal
          categories={categories || []}
          onClose={() => setShowCreateQuiz(false)}
        />
      )}

      {!quizzes || quizzes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-muted/20">
          <Plus className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No quizzes created yet.</p>
          <p className="mt-1">Click &quot;Create Quiz&quot; to build your first exam.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}
    </div>
  );
}
