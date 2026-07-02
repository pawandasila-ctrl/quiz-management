"use client";

import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  useAdminQuizDetails,
  usePublishQuiz,
  useCloseQuiz,
} from "@/models/quiz/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ArrowLeft,
  Plus,
  AlertCircle,
  Clock,
  Star,
  ListOrdered,
  BookOpen,
  Rocket,
  Lock,
  CheckCircle2,
  FileQuestion,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import QuestionCard from "@/components/admin/quiz/QuestionCard";
import AddQuestionModal from "@/components/admin/quiz/AddQuestionModal";
import { QuizStatus } from "@/models/quiz/types";

interface QuizBuilderProps {
  quizId: number;
}

const STATUS_CONFIG: Record<
  QuizStatus,
  { label: string; accent: string; badge: string }
> = {
  draft: {
    label: "Draft",
    accent: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  published: {
    label: "Published",
    accent: "bg-green-500",
    badge: "bg-green-50 text-green-700 border-green-200",
  },
  closed: {
    label: "Closed",
    accent: "bg-slate-400",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

export default function QuizBuilder({ quizId }: QuizBuilderProps) {
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  const { data: quiz, isLoading, error } = useAdminQuizDetails(quizId);
  const publishMutation = usePublishQuiz();
  const closeMutation = useCloseQuiz();

  const statusCfg = useMemo(
    () => STATUS_CONFIG[quiz?.status ?? "draft"],
    [quiz?.status],
  );
  const isDraft = quiz?.status === "draft";
  const questions = useMemo(() => quiz?.questions ?? [], [quiz?.questions]);

  const handlePublish = useCallback(() => {
    publishMutation.mutate(quizId, {
      onSuccess: () =>
        toast.success("Quiz published! Students can now take it."),
      onError: (err) => toast.error(err.message || "Failed to publish."),
    });
  }, [publishMutation, quizId]);

  const handleClose = useCallback(() => {
    closeMutation.mutate(quizId, {
      onSuccess: () => toast.success("Quiz closed."),
      onError: (err) => toast.error(err.message || "Failed to close."),
    });
  }, [closeMutation, quizId]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-12 text-destructive">
        <AlertCircle className="h-10 w-10" />
        <p className="font-semibold">Failed to load quiz details.</p>
        <Link href="/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Quiz Management
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Top breadcrumb + actions bar ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Quiz Management
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
            {quiz.title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Status badge */}
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
              statusCfg.badge,
            )}
          >
            {statusCfg.label}
          </span>

          {isDraft && questions.length > 0 && (
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={publishMutation.isPending}
              className="gap-1.5 bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
            >
              {publishMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Rocket className="h-3.5 w-3.5" />
              )}
              Publish Quiz
            </Button>
          )}

          {quiz.status === "published" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleClose}
              disabled={closeMutation.isPending}
              className="gap-1.5 h-8 text-xs"
            >
              {closeMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
              Close Quiz
            </Button>
          )}

          {isDraft && (
            <Button
              size="sm"
              onClick={() => setShowAddQuestion(true)}
              className="gap-1.5 h-8 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Question
            </Button>
          )}
        </div>
      </div>

      {/* ── Quiz info header card ──────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className="text-xs capitalize border-border text-muted-foreground"
                >
                  {quiz.category?.name ?? "Uncategorized"}
                </Badge>
              </div>
              <h2 className="text-xl font-bold text-foreground leading-tight">
                {quiz.title}
              </h2>
              {quiz.description && (
                <p className="text-sm text-muted-foreground">
                  {quiz.description}
                </p>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileQuestion className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Questions</p>
                <p className="text-sm font-bold text-foreground">
                  {questions.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Marks</p>
                <p className="text-sm font-bold text-foreground">
                  {quiz.total_marks}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Time Limit</p>
                <p className="text-sm font-bold text-foreground">
                  {quiz.time_limit_minutes
                    ? `${quiz.time_limit_minutes} min`
                    : "Unlimited"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Star className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pass Mark</p>
                <p className="text-sm font-bold text-foreground">
                  {quiz.pass_mark}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Questions section ──────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">
              Questions
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({questions.length})
              </span>
            </h3>
          </div>
          {isDraft && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddQuestion(true)}
              className="gap-1.5 h-8 text-xs border-border"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Question
            </Button>
          )}
        </div>

        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/20 py-16">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <FileQuestion className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">No questions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isDraft
                  ? "Add your first question to get started."
                  : "This quiz has no questions."}
              </p>
            </div>
            {isDraft && (
              <Button
                size="sm"
                onClick={() => setShowAddQuestion(true)}
                className="gap-1.5 mt-1"
              >
                <Plus className="h-4 w-4" />
                Add First Question
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                quizId={quizId}
                question={q}
                index={idx}
                isDraft={isDraft}
              />
            ))}

            {/* Publish CTA after questions when in draft */}
            {isDraft && questions.length > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50/50 p-4">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">
                    Ready to publish?
                  </p>
                  <p className="text-xs text-green-700 mt-0.5">
                    This quiz has {questions.length} question
                    {questions.length !== 1 ? "s" : ""} worth {quiz.total_marks}{" "}
                    marks.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handlePublish}
                  disabled={publishMutation.isPending}
                  className="gap-1.5 bg-green-600 hover:bg-green-700 text-white shrink-0"
                >
                  {publishMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Rocket className="h-3.5 w-3.5" />
                  )}
                  Publish
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Add Question Dialog ────────────────────────────────────────── */}
      {showAddQuestion && (
        <AddQuestionModal
          quizId={quizId}
          onClose={() => setShowAddQuestion(false)}
        />
      )}
    </div>
  );
}
