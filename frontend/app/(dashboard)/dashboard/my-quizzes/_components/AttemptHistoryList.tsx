"use client";

import React from "react";
import Link from "next/link";
import { useStudentAttempts } from "@/modules/quiz/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Play,
} from "lucide-react";

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds?: number | null) {
  if (seconds === null || seconds === undefined) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

import { QuizAttempt } from "@/modules/quiz/types";

interface AttemptHistoryListProps {
  initialAttempts?: QuizAttempt[];
}

export default function AttemptHistoryList({
  initialAttempts,
}: AttemptHistoryListProps) {
  const {
    data: attempts,
    isLoading: isAttemptsLoading,
    error,
  } = useStudentAttempts({
    initialData: initialAttempts,
  });
  const isLoading = isAttemptsLoading && !attempts;
  const quizAttempts = React.useMemo(() => attempts || [], [attempts]);

  const groupedAttempts = React.useMemo(() => {
    const map = new Map<
      number,
      {
        quiz_title: string;
        quiz_description: string | null;
        results_visible: boolean;
        attempts: typeof quizAttempts;
      }
    >();

    for (const attempt of quizAttempts) {
      const existing = map.get(attempt.quiz_id);
      const title = attempt.quiz?.title || `Quiz #${attempt.quiz_id}`;
      const description = attempt.quiz?.description || null;
      const results_visible = attempt.quiz?.results_visible ?? false;

      if (!existing) {
        map.set(attempt.quiz_id, {
          quiz_title: title,
          quiz_description: description,
          results_visible,
          attempts: [attempt],
        });
      } else {
        existing.attempts.push(attempt);
      }
    }
    return map;
  }, [quizAttempts]);

  const quizGroups = React.useMemo(() => {
    return Array.from(groupedAttempts.values());
  }, [groupedAttempts]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {Array.from({ length: 3 }).map((_, groupIdx) => (
          <div
            key={groupIdx}
            className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs space-y-0"
          >
            {/* Group Header Skeleton */}
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-44 rounded-md" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-24 rounded-full" />
            </div>

            {/* Attempt Rows Skeleton */}
            <div className="divide-y divide-border/60">
              {Array.from({ length: 2 }).map((_, rowIdx) => (
                <div
                  key={rowIdx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4"
                >
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-28 rounded-md" />
                        <Skeleton className="h-4 w-16 rounded-full" />
                      </div>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-3.5 w-24 rounded-md" />
                        <Skeleton className="h-3.5 w-16 rounded-md" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pl-10 sm:pl-0">
                    <div className="space-y-1 text-right">
                      <Skeleton className="h-5 w-16 rounded-md ml-auto" />
                      <Skeleton className="h-3 w-10 rounded-md ml-auto" />
                    </div>
                    <Skeleton className="h-8 w-28 rounded-xl shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Failed to load attempts. Please refresh the page.</span>
      </div>
    );
  }

  if (quizAttempts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="rounded-xl border border-border p-4 text-muted-foreground">
          <ClipboardList className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-foreground">No attempts yet</p>
          <p className="text-sm text-muted-foreground">
            Head to Available Quizzes to start your first attempt.
          </p>
        </div>
        <Link href="/dashboard">
          <Button size="sm" variant="outline">
            Browse Quizzes
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {quizGroups.map((group) => (
        <div
          key={group.quiz_title}
          className="rounded-xl border border-border overflow-hidden"
        >
          {/* Quiz Group Header */}
          <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-5 py-3.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="font-semibold text-sm text-foreground truncate">
                {group.quiz_title}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {group.attempts.length}{" "}
                {group.attempts.length === 1 ? "attempt" : "attempts"}
              </span>
            </div>
            <span
              className={`text-xs font-medium shrink-0 ${
                group.results_visible ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {group.results_visible ? "Results released" : "Pending results"}
            </span>
          </div>

          {/* Description (optional) */}
          {group.quiz_description && (
            <div className="px-5 py-2 bg-muted/10 border-b border-border/50">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {group.quiz_description}
              </p>
            </div>
          )}

          {/* Attempt Rows */}
          <div className="divide-y divide-border/60">
            {group.attempts
              .slice()
              .sort((a, b) => b.attempt_number - a.attempt_number)
              .map((attempt) => {
                const isGraded = attempt.status === "graded";
                const isInProgress = attempt.status === "in_progress";
                const scorePercent =
                  attempt.score !== null && attempt.total_marks > 0
                    ? Math.round((attempt.score / attempt.total_marks) * 100)
                    : null;

                return (
                  <div
                    key={attempt.id}
                    className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/20 transition-colors"
                  >
                    {/* Left: attempt info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-background text-xs font-bold text-muted-foreground">
                        #{attempt.attempt_number}
                      </div>
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">
                            Attempt #{attempt.attempt_number}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] capitalize px-1.5 py-0 h-4 border-none font-semibold ${
                              isGraded
                                ? "bg-violet-50 text-violet-600 dark:bg-violet-950/30"
                                : isInProgress
                                  ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {attempt.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(
                              attempt.submitted_at || attempt.started_at,
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(attempt.time_taken_seconds)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: score + action */}
                    <div className="flex items-center gap-4 pl-10 sm:pl-0">
                      {/* Score */}
                      {attempt.score !== null ? (
                        <div className="text-right">
                          <p className="text-base font-bold text-foreground leading-none">
                            {attempt.score}
                            <span className="text-xs font-normal text-muted-foreground">
                              /{attempt.total_marks}
                            </span>
                          </p>
                          {scorePercent !== null && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {scorePercent}%
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">—</p>
                        </div>
                      )}

                      {/* Pass/Fail */}
                      {isGraded && group.results_visible && (
                        <div className="shrink-0">
                          {attempt.passed ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Pass
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
                              <XCircle className="h-3.5 w-3.5" />
                              Fail
                            </span>
                          )}
                        </div>
                      )}

                      {/* Action button */}
                      <div className="shrink-0">
                        {isGraded ? (
                          group.results_visible ? (
                            <Link
                              href={`/dashboard/quiz/${attempt.quiz_id}/attempt/${attempt.id}`}
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs gap-1.5"
                              >
                                Review Answers
                                <ChevronRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Pending release
                            </span>
                          )
                        ) : isInProgress ? (
                          <Link href={`/quiz/${attempt.quiz_id}`}>
                            <Button size="sm" className="h-8 text-xs gap-1.5">
                              <Play className="h-3 w-3 fill-current" />
                              Continue
                            </Button>
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Awaiting grading
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
