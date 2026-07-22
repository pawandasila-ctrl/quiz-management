"use client";

import React from "react";
import { useStudentQuizzes, useStudentAttempts } from "@/modules/quiz/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ClipboardCheck } from "lucide-react";
import StudentQuizCard from "@/modules/quiz/components/student-quiz-card";
import { QuizGridSkeleton } from "@/modules/quiz/components/QuizCardSkeleton";

import { Quiz, QuizAttempt, PaginatedResponse } from "@/modules/quiz/types";

interface StudentQuizListProps {
  initialQuizzes?: PaginatedResponse<Quiz> | Quiz[];
  initialAttempts?: QuizAttempt[];
}

export default function StudentQuizList({
  initialQuizzes,
  initialAttempts,
}: StudentQuizListProps) {
  const formattedInitialData: PaginatedResponse<Quiz> | undefined = React.useMemo(() => {
    if (!initialQuizzes) return undefined;
    if (Array.isArray(initialQuizzes)) {
      return {
        items: initialQuizzes,
        total: initialQuizzes.length,
        page: 1,
        limit: 10,
        pages: 1,
      };
    }
    return initialQuizzes;
  }, [initialQuizzes]);

  const {
    data: quizData,
    isLoading: isQuizzesLoading,
    error: quizzesError,
  } = useStudentQuizzes(undefined, { initialData: formattedInitialData });

  const { data: attempts, isLoading: isAttemptsLoading } = useStudentAttempts({
    initialData: initialAttempts,
  });

  const quizzes = quizData?.items || [];

  const isLoading =
    (isQuizzesLoading || isAttemptsLoading) && !quizData && !attempts;

  if (isLoading) {
    return <QuizGridSkeleton count={6} />;
  }

  if (quizzesError) {
    return (
      <Card className="border-destructive bg-destructive/5 text-destructive p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6" />
          <div>
            <h3 className="font-semibold text-lg">Error loading quizzes</h3>
            <p className="text-sm">
              Please refresh the page or contact support.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <Card className="border-dashed border-border py-12 text-center">
        <CardContent className="space-y-3">
          <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="font-semibold text-lg text-foreground">
            No Quizzes Available
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            There are currently no published quizzes. Check back later or ask
            your administrator.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {quizzes.map((quiz) => (
        <StudentQuizCard key={quiz.id} quiz={quiz} attempts={attempts || []} />
      ))}
    </div>
  );
}
