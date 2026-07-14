"use client";

import React from "react";
import Link from "next/link";
import { useStudentAttempts } from "@/modules/quiz/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
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

export default function AttemptHistoryList() {
  const { data: attempts, isLoading, error } = useStudentAttempts();
  const quizAttempts = React.useMemo(() => attempts || [], [attempts]);

  const groupedAttempts = React.useMemo(() => {
    return quizAttempts.reduce<
      Record<
        number,
        {
          quiz_title: string;
          quiz_description: string | null;
          results_visible: boolean;
          attempts: typeof quizAttempts;
        }
      >
    >((acc, attempt) => {
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
    }, {});
  }, [quizAttempts]);

  const quizGroups = React.useMemo(() => {
    return Object.values(groupedAttempts);
  }, [groupedAttempts]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
                group.results_visible
                  ? "text-emerald-600"
                  : "text-amber-600"
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
                            {formatDate(attempt.submitted_at || attempt.started_at)}
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
