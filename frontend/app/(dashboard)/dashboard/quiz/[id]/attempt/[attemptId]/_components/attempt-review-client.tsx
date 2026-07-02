"use client";

import React from "react";
import { useStudentQuizDetails, useQuizAttemptResult } from "@/models/quiz/hooks";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import ReviewHeader from "@/components/review/ReviewHeader";
import ReviewScorecard from "@/components/review/ReviewScorecard";
import QuestionReviewList from "@/components/review/QuestionReviewList";

interface StudentAttemptReviewClientProps {
  quizId: number;
  attemptId: number;
}

export default function StudentAttemptReviewClient({
  quizId,
  attemptId,
}: StudentAttemptReviewClientProps) {
  const { data: quiz, isLoading: isQuizLoading } = useStudentQuizDetails(quizId);
  
  // Fetch attempt result (requires results_visible to be true on the backend)
  const { data: attempt, isLoading: isAttemptLoading, error } = useQuizAttemptResult(attemptId, {
    enabled: !!quiz?.results_visible && !isNaN(attemptId) && attemptId > 0,
  });

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

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center text-destructive">
        <AlertCircle className="h-10 w-10" />
        <p className="font-semibold">Quiz not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <ReviewHeader
        title={`Quiz Results Review - ${quiz.title}`}
        backUrl="/dashboard"
      />

      <Card className="border-border shadow-sm flex flex-col overflow-hidden">
        <CardContent className="p-6 space-y-6">
          {!quiz.results_visible ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-border rounded-xl bg-muted/20 text-center gap-2">
              <AlertCircle className="h-8 w-8 text-muted-foreground/60 animate-pulse" />
              <p className="text-sm font-semibold text-foreground">Results Not Released</p>
              <p className="text-xs text-muted-foreground max-w-sm leading-normal">
                Quiz results have not been released by the admin yet. Please check back later.
              </p>
            </div>
          ) : error || !attempt ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
              <p className="font-semibold text-foreground">No attempt data available</p>
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
                isAdmin={false}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
