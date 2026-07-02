"use client";

import React from "react";
import { useAdminQuizDetails, useQuizAttemptResult } from "@/models/quiz/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import ReviewHeader from "@/components/review/ReviewHeader";
import ReviewScorecard from "@/components/review/ReviewScorecard";
import QuestionReviewList from "@/components/review/QuestionReviewList";

interface AdminAttemptReviewClientProps {
  quizId: number;
  attemptId: number;
}

export default function AdminAttemptReviewClient({
  quizId,
  attemptId,
}: AdminAttemptReviewClientProps) {
  const { data: quiz, isLoading: isQuizLoading } = useAdminQuizDetails(quizId);
  
  // Fetch attempt result (admin bypasses results_visible, so enabled is true)
  const { data: attempt, isLoading: isAttemptLoading, error } = useQuizAttemptResult(attemptId, {
    enabled: !isNaN(attemptId) && attemptId > 0,
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

  const studentName = attempt?.student?.name || "Student";
  const studentEmail = attempt?.student?.email || "-";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <ReviewHeader
        title={`Submission Review - ${quiz.title}`}
        subtitle={`Reviewing answers submitted by ${studentName} (${studentEmail})`}
        backUrl={`/admin/quiz/${quizId}/submissions`}
      />

      <Card className="border-border shadow-sm flex flex-col overflow-hidden">
        <CardContent className="p-6 space-y-6">
          {error || !attempt ? (
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
                isAdmin={true}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
