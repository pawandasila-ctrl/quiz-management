"use client";

import React from "react";
import { useAdminQuizzes } from "@/modules/quiz/hooks";
import { Loader2, Plus } from "lucide-react";
import QuizCard from "@/modules/quiz/components/QuizCard";

import { Quiz } from "@/modules/quiz/types";

interface AdminQuizListProps {
  initialQuizzes?: Quiz[];
}

export default function AdminQuizList({ initialQuizzes }: AdminQuizListProps) {
  const { data: quizzes, isLoading: isQuizzesLoading } = useAdminQuizzes({
    initialData: initialQuizzes,
  });

  const isLoading = isQuizzesLoading && !quizzes;

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
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {quizzes.map((quiz) => (
        <QuizCard key={quiz.id} quiz={quiz} />
      ))}
    </div>
  );
}
