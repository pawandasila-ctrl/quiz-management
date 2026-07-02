"use client";

import React from "react";
import { useQuizAttemptResult } from "../hooks";
import { Quiz, QuizAttempt } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface StudentQuizResultModalProps {
  attemptId: number;
  quiz: Quiz;
  onClose: () => void;
  fallbackAttempt?: QuizAttempt | null;
  isAdmin?: boolean;
}

export default function StudentQuizResultModal({
  attemptId,
  quiz,
  onClose,
  fallbackAttempt,
  isAdmin = false,
}: StudentQuizResultModalProps) {
  const { data: attempt, isLoading } = useQuizAttemptResult(attemptId, {
    enabled:
      (quiz.results_visible || isAdmin) && !isNaN(attemptId) && attemptId > 0,
  });

  const activeAttempt = attempt || fallbackAttempt;

  const formatTime = (seconds: number | null) => {
    if (seconds === null || seconds === undefined) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Trophy className="h-5.5 w-5.5 text-yellow-500" />
            Quiz Results Review
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Loading attempt review...
            </p>
          </div>
        ) : !quiz.results_visible && !isAdmin ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10 gap-3 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <p className="font-semibold text-foreground">
              Results Not Released
            </p>
            <p className="text-sm text-muted-foreground max-w-sm px-4">
              Quiz results have not been released by the admin yet. Please check
              back later.
            </p>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-3 -mr-3">
            <div className="space-y-6">
              {activeAttempt ? (
                <>
                  {/* Attempt Overview Cards */}
                  <div className="grid grid-cols-3 gap-3 p-4 bg-muted/40 rounded-xl border border-border/80">
                    <div className="flex flex-col items-center justify-center text-center p-2">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        Score
                      </span>
                      <span className="text-2xl font-bold mt-1 text-foreground">
                        {activeAttempt.score ?? 0}
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
                        {activeAttempt.passed ? (
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
                        {formatTime(activeAttempt.time_taken_seconds)}
                      </span>
                    </div>
                  </div>

                  {/* Questions List (Detailed Review) */}
                  {activeAttempt.answers && activeAttempt.answers.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        <HelpCircle className="h-4.5 w-4.5 text-muted-foreground" />
                        Question Breakdown
                      </h3>

                      <div className="space-y-4">
                        {activeAttempt.answers.map((ans, idx) => {
                          const q = ans.question;
                          if (!q) return null;
                          const correctOpt = q.options?.find(
                            (o) => o.is_correct,
                          );

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
                                {/* Selected Option */}
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
                                    <strong>Your Answer:</strong>{" "}
                                    {ans.selected_option?.text ||
                                      "No option selected"}
                                  </span>
                                </div>

                                {/* Correct Option (show if user got it wrong) */}
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
                    <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed border-border rounded-xl bg-muted/20 text-center gap-2">
                      <AlertCircle className="h-8 w-8 text-muted-foreground/60 animate-pulse" />
                      <p className="text-sm font-semibold text-foreground">
                        Detailed Review Locked
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm leading-normal">
                        Detailed question-by-question review is not available
                        yet because results have not been released by the admin.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground" />
                  <p className="font-semibold text-foreground">
                    No attempt data available
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="mt-4 border-t border-border pt-4 shrink-0">
          <Button onClick={onClose} className="w-full sm:w-auto h-9">
            Close Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
