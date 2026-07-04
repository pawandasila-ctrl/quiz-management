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
            <p className="text-sm">
              Please refresh the page or contact support.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (quizAttempts.length === 0) {
    return (
      <Card className="border-dashed border-border py-16 text-center bg-card shadow-sm rounded-2xl max-w-xl mx-auto">
        <CardContent className="space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground/60">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-foreground">
              No quiz attempts yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              You haven&apos;t attempted any quizzes yet. Head back to the
              Available Quizzes portal to start your first assessment.
            </p>
          </div>
          <Link href="/dashboard" className="inline-block pt-1">
            <Button size="sm" className="gap-1.5 font-semibold">
              <Play className="h-3.5 w-3.5" /> Go to Available Quizzes
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {quizGroups.map((group) => (
        <Card
          key={group.quiz_title}
          className="overflow-hidden border border-border shadow-sm rounded-xl bg-card"
        >
          <CardHeader className="px-5 py-3 border-b border-border/40 bg-muted/5">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                    {group.quiz_title}
                  </h2>
                  <Badge
                    variant="secondary"
                    className="text-[9px] font-semibold tracking-wider uppercase bg-accent/30 text-muted-foreground px-1.5 py-0.5 rounded-full"
                  >
                    {group.attempts.length}{" "}
                    {group.attempts.length === 1 ? "Attempt" : "Attempts"}
                  </Badge>
                  {group.results_visible ? (
                    <Badge className="bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600/10 border-none font-semibold text-[9px] uppercase rounded-full">
                      Results Released
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[9px] font-semibold uppercase rounded-full bg-amber-500/5 text-amber-600 border-amber-500/20"
                    >
                      Results Pending
                    </Badge>
                  )}
                </div>
                {group.quiz_description && (
                  <CardDescription className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                    {group.quiz_description}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-2.5">
            <div className="space-y-2.5">
              {group.attempts
                .slice()
                .sort((a, b) => b.attempt_number - a.attempt_number)
                .map((attempt) => {
                  const isGraded = attempt.status === "graded";
                  const isPassed = attempt.passed;

                  return (
                    <div
                      key={attempt.id}
                      className="rounded-xl border border-border/60 bg-muted/15 px-4 py-2.5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/20 hover:border-border/80 transition-all duration-150"
                    >
                      {/* Left: Attempt Number & Status */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-9 w-9 shrink-0 rounded-lg bg-background border border-border flex items-center justify-center font-bold text-xs text-foreground shadow-sm">
                          #{attempt.attempt_number}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">
                              Attempt Details
                            </span>
                            <Badge
                              variant={
                                attempt.status === "graded"
                                  ? "outline"
                                  : attempt.status === "in_progress"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className="text-[9px] uppercase tracking-wider font-bold h-4.5 px-1.5 py-0 rounded-md border-border/80"
                            >
                              {attempt.status.replace("_", " ")}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                              {formatDate(
                                attempt.submitted_at || attempt.started_at,
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                              Duration:{" "}
                              {formatDuration(attempt.time_taken_seconds)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Score, Result Badge & Action Button */}
                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-x-6 gap-y-3 pt-2 sm:pt-0 border-t border-border/30 sm:border-none">
                        {/* Score Indicator */}
                        <div className="flex items-center gap-2.5">
                          <div className="flex flex-col text-right">
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                              Score
                            </span>
                            <span className="text-sm font-bold text-foreground">
                              {attempt.score !== null
                                ? `${attempt.score} / ${attempt.total_marks}`
                                : "N/A"}
                            </span>
                          </div>

                          {isGraded && group.results_visible && (
                            <div className="shrink-0">
                              {isPassed ? (
                                <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-bold text-[9px] uppercase gap-1 py-0.5 rounded-md">
                                  <CheckCircle2 className="h-3 w-3" /> Pass
                                </Badge>
                              ) : (
                                <Badge
                                  variant="destructive"
                                  className="font-bold text-[9px] uppercase gap-1 py-0.5 rounded-md"
                                >
                                  <XCircle className="h-3 w-3" /> Fail
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="shrink-0">
                          {attempt.status === "graded" ? (
                            group.results_visible ? (
                              <Link
                                href={`/dashboard/quiz/${attempt.quiz_id}/attempt/${attempt.id}`}
                              >
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8.5 text-xs font-semibold gap-1.5 border-border hover:bg-accent"
                                >
                                  Review Answers{" "}
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            ) : (
                              <div className="h-8.5 inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-500/5 px-2.5 rounded-lg border border-amber-500/10">
                                <Clock className="h-3.5 w-3.5 animate-pulse" />{" "}
                                Pending Release
                              </div>
                            )
                          ) : attempt.status === "in_progress" ? (
                            <Link href={`/quiz/${attempt.quiz_id}`}>
                              <Button
                                size="sm"
                                className="h-8.5 text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm"
                              >
                                <Play className="h-3.5 w-3.5 fill-current" />{" "}
                                Continue
                              </Button>
                            </Link>
                          ) : (
                            <Badge variant="outline" className="text-xs">
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
