"use client";

import React from "react";
import Link from "next/link";
import { useStudentAttempts } from "@/modules/quiz/hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ClipboardList,
  AlertCircle,
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Play,
  Sparkles,
  Timer,
} from "lucide-react";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds?: number | null) {
  if (seconds === null || seconds === undefined) return "-";
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
    return Object.values(groupedAttempts).sort((a, b) => {
      const aLatest = Math.max(...a.attempts.map((att) => att.attempt_number));
      const bLatest = Math.max(...b.attempts.map((att) => att.attempt_number));
      return bLatest - aLatest;
    });
  }, [groupedAttempts]);

  if (isLoading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-medium animate-pulse">
            Loading your attempt history...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/10 text-red-900 dark:text-red-200 p-6 rounded-2xl shadow-sm max-w-2xl mx-auto">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-base">Error loading attempts</h3>
            <p className="text-sm text-red-700/80 dark:text-red-300/80 leading-relaxed">
              We encountered an issue fetching your attempts. Please refresh the
              page or try again.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (quizAttempts.length === 0) {
    return (
      <Card className="border-dashed border-border py-16 text-center bg-card shadow-sm rounded-2xl max-w-xl mx-auto">
        <CardContent className="space-y-5">
          <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto text-primary animate-bounce">
            <ClipboardList className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-xl text-foreground tracking-tight">
              No Quiz Attempts Yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              You haven&apos;t attempted any quizzes yet. Head back to the
              Available Quizzes portal to start your first assessment.
            </p>
          </div>
          <Link href="/dashboard" className="inline-block pt-1">
            <Button
              size="sm"
              className="gap-2 font-semibold shadow-sm px-5 h-9.5"
            >
              <Play className="h-3.5 w-3.5 fill-current" /> Go to Available
              Quizzes
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {quizGroups.map((group) => (
        <Card
          key={group.quiz_title}
          className="overflow-hidden border border-border/80 shadow-md rounded-2xl bg-card hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/80"
        >
          <CardHeader className="px-6 py-4.5 border-b border-border/40 bg-linear-to-r from-muted/20 to-transparent">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                    {group.quiz_title}
                  </h2>
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-bold tracking-wider uppercase bg-primary/5 text-primary border border-primary/10 px-2 py-0.5 rounded-full"
                  >
                    {group.attempts.length}{" "}
                    {group.attempts.length === 1 ? "Attempt" : "Attempts"}
                  </Badge>
                  {group.results_visible ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 border-none font-bold text-[9px] uppercase rounded-full px-2 py-0.5 flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" /> Results Released
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[9px] font-bold uppercase rounded-full bg-amber-500/5 text-amber-600 border-amber-500/15 px-2 py-0.5"
                    >
                      Results Pending
                    </Badge>
                  )}
                </div>
                {group.quiz_description && (
                  <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                    {group.quiz_description}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-3.5">
            <div className="space-y-3">
              {group.attempts
                .slice()
                .sort((a, b) => b.attempt_number - a.attempt_number)
                .map((attempt) => {
                  const isGraded = attempt.status === "graded";
                  const isPassed = attempt.passed;
                  const scorePercent =
                    attempt.score !== null && attempt.total_marks > 0
                      ? Math.round((attempt.score / attempt.total_marks) * 100)
                      : null;

                  return (
                    <div
                      key={attempt.id}
                      className="rounded-xl border border-border/50 bg-muted/10 hover:bg-muted/20 hover:border-primary/20 px-5 py-4.5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="h-11 w-11 shrink-0 rounded-xl bg-linear-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center font-extrabold text-sm text-primary shadow-sm">
                          #{attempt.attempt_number}
                        </div>
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-sm text-foreground tracking-tight">
                              Attempt Details
                            </span>
                            <Badge
                              variant={
                                attempt.status === "graded"
                                  ? "outline"
                                  : "secondary"
                              }
                              className={`text-[9px] uppercase tracking-wider font-extrabold h-5 px-2 py-0 rounded-md ${
                                attempt.status === "graded"
                                  ? "bg-violet-500/5 text-violet-600 border-violet-500/10"
                                  : attempt.status === "in_progress"
                                    ? "bg-amber-500/5 text-amber-600 border-amber-500/10 animate-pulse"
                                    : "bg-rose-500/5 text-rose-600 border-rose-500/10"
                              }`}
                            >
                              {attempt.status.replace("_", " ")}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                              {formatDate(
                                attempt.submitted_at || attempt.started_at,
                              )}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                              Time taken:{" "}
                              {formatDuration(attempt.time_taken_seconds)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Score Metric, Result Badge & CTA Action Button */}
                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-x-8 gap-y-4 pt-3.5 sm:pt-0 border-t border-border/30 sm:border-none">
                        {/* Score Metric Ring or Tag */}
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col text-right">
                            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                              Score
                            </span>
                            <span className="text-base font-extrabold text-foreground tracking-tight">
                              {attempt.score !== null
                                ? `${attempt.score} / ${attempt.total_marks}`
                                : "N/A"}
                            </span>
                            {scorePercent !== null && (
                              <span className="text-[10px] text-muted-foreground/75 font-semibold">
                                {scorePercent}% Score
                              </span>
                            )}
                          </div>

                          {isGraded && group.results_visible && (
                            <div className="shrink-0">
                              {isPassed ? (
                                <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white font-extrabold text-[9px] uppercase gap-1 py-1 px-2.5 rounded-lg shadow-sm border-none">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Pass
                                </Badge>
                              ) : (
                                <Badge
                                  variant="destructive"
                                  className="font-extrabold text-[9px] uppercase gap-1 py-1 px-2.5 rounded-lg shadow-sm border-none bg-rose-500 hover:bg-rose-500"
                                >
                                  <XCircle className="h-3.5 w-3.5" /> Fail
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        {/* CTA Buttons */}
                        <div className="shrink-0">
                          {attempt.status === "graded" ? (
                            group.results_visible ? (
                              <Link
                                href={`/dashboard/quiz/${attempt.quiz_id}/attempt/${attempt.id}`}
                              >
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-9 text-xs font-bold gap-2 border-border hover:bg-accent hover:text-accent-foreground px-4 rounded-xl shadow-sm transition-all"
                                >
                                  Review Answers{" "}
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </Link>
                            ) : (
                              <div className="h-9 inline-flex items-center gap-2 text-[11px] font-semibold text-amber-600 bg-amber-500/5 px-3.5 rounded-xl border border-amber-500/10">
                                <Timer className="h-3.5 w-3.5 animate-pulse" />{" "}
                                Pending Release
                              </div>
                            )
                          ) : attempt.status === "in_progress" ? (
                            <Link href={`/quiz/${attempt.quiz_id}`}>
                              <Button
                                size="sm"
                                className="h-9 text-xs font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md px-4 rounded-xl"
                              >
                                <Play className="h-3.5 w-3.5 fill-current" />{" "}
                                Continue
                              </Button>
                            </Link>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-xs py-1 px-3"
                            >
                              Awaiting Grading
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
