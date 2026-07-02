"use client";

import React from "react";
import {
  useAdminQuizDetails,
  useQuizAttemptResult,
} from "@/models/quiz/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import ReviewScorecard from "./ReviewScorecard";
import QuestionReviewList from "./QuestionReviewList";

interface AttemptReviewContainerClientProps {
  quizId: number;
  attemptId: number;
  isAdmin?: boolean;
}

export default function AttemptReviewContainerClient({
  quizId,
  attemptId,
  isAdmin = false,
}: AttemptReviewContainerClientProps) {
  const { data: adminQuiz, isLoading: isAdminQuizLoading } =
    useAdminQuizDetails(isAdmin ? quizId : NaN);

  const {
    data: attempt,
    isLoading: isAttemptLoading,
    error,
  } = useQuizAttemptResult(attemptId, {
    enabled: !isNaN(attemptId) && attemptId > 0,
  });

  
  const quiz = isAdmin ? adminQuiz : attempt?.quiz;
  const isQuizLoading = isAdmin ? isAdminQuizLoading : false;
  const isLoading = isQuizLoading || isAttemptLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
          Loading attempt review...
        </p>
      </div>
    );
  }

  if (!quiz || !attempt) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center text-destructive">
        <AlertCircle className="h-10 w-10" />
        <p className="font-semibold">
          {!quiz ? "Quiz not found" : "Attempt data not found"}
        </p>
      </div>
    );
  }

  return (
    <Card className="border-border shadow-sm flex flex-col overflow-hidden">
      <CardContent className="p-6 space-y-6">
        {!isAdmin && !quiz.results_visible ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-border rounded-xl bg-muted/20 text-center gap-2">
            <AlertCircle className="h-8 w-8 text-muted-foreground/60 animate-pulse" />
            <p className="text-sm font-semibold text-foreground">
              Results Not Released
            </p>
            <p className="text-xs text-muted-foreground max-w-sm leading-normal">
              Quiz results have not been released by the admin yet. Please check
              back later.
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <p className="font-semibold text-foreground">
              Failed to load attempt data
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <ReviewScorecard
              score={attempt.score ?? 0}
              totalMarks={quiz.total_marks}
              passed={!!attempt.passed}
              timeTakenSeconds={attempt.time_taken_seconds}
            />
            <QuestionReviewList
              answers={attempt.answers || []}
              isAdmin={isAdmin}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

