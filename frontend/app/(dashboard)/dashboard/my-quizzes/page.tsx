"use client";

import React from "react";
import Link from "next/link";
import { useStudentAttempts } from "@/models/quiz/hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ClipboardList, AlertCircle } from "lucide-react";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MyQuizzesPage() {
  const { data: attempts, isLoading, error } = useStudentAttempts();
  const quizAttempts = attempts || [];

  const groupedAttempts = React.useMemo(() => {
    return quizAttempts.reduce<Record<number, { quiz_title: string; quiz_description: string | null; results_visible: boolean; attempts: typeof quizAttempts }>>(
      (acc, attempt) => {
        const existing = acc[attempt.quiz_id];
        const title = attempt.quiz?.title || `Quiz #${attempt.quiz_id}`;
        const description = attempt.quiz?.description || null;
        const results_visible = attempt.quiz?.results_visible ?? false;

        if (!existing) {
          acc[attempt.quiz_id] = {
            quiz_title: title,
            quiz_description: description,
            results_visible,
            attempts: [attempt],
          };
        } else {
          existing.attempts.push(attempt);
        }

        return acc;
      },
      {},
    );
  }, [quizAttempts]);

  const quizGroups = React.useMemo(() => {
    return Object.values(groupedAttempts).sort((a, b) => {
      const aLatest = Math.max(...a.attempts.map((att) => att.attempt_number));
      const bLatest = Math.max(...b.attempts.map((att) => att.attempt_number));
      return bLatest - aLatest;
    });
  }, [groupedAttempts]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive bg-destructive/5 text-destructive p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6" />
          <div>
            <h3 className="font-semibold text-lg">Error loading attempts</h3>
            <p className="text-sm">Please refresh the page or contact support.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[.24em] text-muted-foreground">
              My Quizzes
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Attempt History
            </h1>
          </div>
          <Link href="/dashboard" className="inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent">
            View Available Quizzes
          </Link>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Track every quiz you started, see your scores, full attempt status, and jump to review when results are released.
        </p>
      </div>

      {quizAttempts.length === 0 ? (
        <Card className="border-dashed border-border py-16 text-center">
          <CardContent className="space-y-3">
            <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="font-semibold text-lg text-foreground">No quiz attempts yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              You haven't attempted any quizzes. Head to the Available Quizzes page to start your first quiz.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {quizGroups.map((group) => (
            <Card key={group.quiz_title} className="overflow-hidden border-border shadow-sm">
              <CardHeader className="p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold tracking-tight text-foreground">
                        {group.quiz_title}
                      </h2>
                      <Badge variant="secondary" className="uppercase text-[11px] tracking-[.24em]">
                        {group.attempts.length} attempt{group.attempts.length === 1 ? "" : "s"}
                      </Badge>
                      {group.results_visible ? (
                        <Badge variant="outline" className="text-xs">
                          Results Released
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Results Pending
                        </Badge>
                      )}
                    </div>
                    {group.quiz_description ? (
                      <CardDescription>{group.quiz_description}</CardDescription>
                    ) : null}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {group.attempts
                  .slice()
                  .sort((a, b) => b.attempt_number - a.attempt_number)
                  .map((attempt) => (
                    <div
                      key={attempt.id}
                      className="rounded-2xl border border-border bg-card p-4 sm:flex sm:items-center sm:justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                          <span>Attempt #{attempt.attempt_number}</span>
                          <Badge
                            variant={
                              attempt.status === "graded"
                                ? "outline"
                                : attempt.status === "in_progress"
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-[11px] uppercase"
                          >
                            {attempt.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                          <span>Score: {attempt.score ?? "N/A"} / {attempt.total_marks}</span>
                          <span>Time taken: {attempt.time_taken_seconds ?? "-"} sec</span>
                          <span>Submitted: {formatDate(attempt.submitted_at)}</span>
                          <span>Graded: {formatDate(attempt.graded_at)}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-2 sm:mt-0 sm:items-end">
                        {attempt.status === "graded" ? (
                          group.results_visible ? (
                            <Link href={`/dashboard/quiz/${attempt.quiz_id}/attempt/${attempt.id}`}>
                              <Button className="h-9 px-4 text-sm">Review Answers</Button>
                            </Link>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Waiting for release
                            </Badge>
                          )
                        ) : attempt.status === "in_progress" ? (
                          <Link href={`/dashboard/quiz/${attempt.quiz_id}`}>
                            <Button className="h-9 px-4 text-sm">Continue Quiz</Button>
                          </Link>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Awaiting grading
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
              </CardContent>

              <CardFooter className="flex justify-end border-t border-border p-4">
                <span className="text-xs text-muted-foreground">
                  Joined history of your quiz attempts, sorted newest first.
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
