"use client";

import React, { use } from "react";
import { useAdminQuizDetails, useQuizAttemptResult } from "@/models/quiz/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string; attemptId: string }>;
}

export default function AdminAttemptReviewPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const quizId = Number(resolvedParams.id);
  const attemptId = Number(resolvedParams.attemptId);
  const router = useRouter();

  const { data: quiz, isLoading: isQuizLoading } = useAdminQuizDetails(quizId);

  const {
    data: attempt,
    isLoading: isAttemptLoading,
    error,
  } = useQuizAttemptResult(attemptId, {
    enabled: !isNaN(attemptId) && attemptId > 0,
  });

  const isLoading = isQuizLoading || isAttemptLoading;

  const formatTime = (seconds: number | null) => {
    if (seconds === null || seconds === undefined) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

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
      {/* Header Back Button */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/admin/quiz/${quizId}/submissions`)}
          className="gap-1.5 border border-border bg-background hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Submissions
        </Button>
      </div>

      <Card className="border-border shadow-sm flex flex-col overflow-hidden">
        <CardHeader className="p-6 border-b border-border/80">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Trophy className="h-5.5 w-5.5 text-yellow-500" />
              Submission Review - {quiz.title}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Reviewing answers submitted by{" "}
              <strong className="text-foreground">{studentName}</strong> (
              {studentEmail})
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {error || !attempt ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
              <p className="font-semibold text-foreground">
                No attempt data available
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Attempt Overview Cards */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-muted/40 rounded-xl border border-border/80">
                <div className="flex flex-col items-center justify-center text-center p-2">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Score
                  </span>
                  <span className="text-2xl font-bold mt-1 text-foreground">
                    {attempt.score ?? 0}
                    <span className="text-xs text-muted-foreground font-normal">
                      {" "}
                      / {quiz.total_marks}
                    </span>
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center text-center p-2 border-x border-border/60">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Result
                  </span>
                  <div className="mt-1.5">
                    {attempt.passed ? (
                      <Badge className="bg-green-600 hover:bg-green-600 text-white gap-1 py-0.5 text-xs font-semibold">
                        <CheckCircle2 className="h-3 w-3" /> Passed
                      </Badge>
                    ) : (
                      <Badge
                        variant="destructive"
                        className="gap-1 py-0.5 text-xs font-semibold"
                      >
                        <XCircle className="h-3 w-3" /> Failed
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center text-center p-2">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Time Taken
                  </span>
                  <span className="text-sm font-semibold mt-2 flex items-center gap-1 text-foreground">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatTime(attempt.time_taken_seconds)}
                  </span>
                </div>
              </div>

              {/* Questions List */}
              {attempt.answers && attempt.answers.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 border-b border-border/80 pb-2">
                    <HelpCircle className="h-4.5 w-4.5 text-muted-foreground" />
                    Question Breakdown
                  </h3>

                  <div className="space-y-4">
                    {attempt.answers.map((ans, idx) => {
                      const q = ans.question;
                      if (!q) return null;
                      const correctOpt = q.options?.find((o) => o.is_correct);

                      return (
                        <div
                          key={ans.id}
                          className="p-4 rounded-xl border border-border bg-card space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md shrink-0">
                              Q{idx + 1}
                            </span>
                            <span className="text-xs text-muted-foreground font-medium shrink-0 mt-0.5">
                              {ans.marks_awarded} / {q.marks} Marks
                            </span>
                          </div>

                          <p className="text-sm font-semibold text-foreground">
                            {q.text}
                          </p>

                          <div className="grid gap-2 text-xs pt-1">
                            <div
                              className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                                ans.is_correct
                                  ? "bg-green-50/50 border-green-200 text-green-800"
                                  : "bg-red-50/50 border-red-200 text-red-800"
                              }`}
                            >
                              {ans.is_correct ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                              )}
                              <span>
                                <strong>Student&apos;s Answer:</strong>{" "}
                                {ans.selected_option?.text ||
                                  "No option selected"}
                              </span>
                            </div>

                            {/* Correct Option */}
                            {!ans.is_correct && correctOpt && (
                              <div className="p-2.5 rounded-lg border border-green-150 bg-green-50/20 text-green-800 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                <span>
                                  <strong>Correct Answer:</strong>{" "}
                                  {correctOpt.text}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Explanation */}
                          {q.explanation && (
                            <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground border border-border/60">
                              <strong className="text-foreground">
                                Explanation:
                              </strong>{" "}
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-muted/20">
                  <p>No answers recorded for this attempt.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
