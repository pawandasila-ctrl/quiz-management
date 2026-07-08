"use client";

import ConfirmDialog from "@/components/ConfirmDialog";

import React, { useCallback, useMemo } from "react";
import Link from "next/link";
import {
  usePublishQuiz,
  useCloseQuiz,
  useReleaseResults,
  useDeleteQuiz,
} from "../hooks";
import { Quiz, QuizStatus } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Rocket,
  Lock,
  Eye,
  Trophy,
  Clock,
  Star,
  Layers,
  Users,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface QuizCardProps {
  quiz: Quiz;
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

export const QuizCard = React.memo(function QuizCard({ quiz }: QuizCardProps) {
  const publishMutation = usePublishQuiz();
  const closeMutation = useCloseQuiz();
  const releaseResultsMutation = useReleaseResults();
  const deleteQuizMutation = useDeleteQuiz();

  const statusCfg = useMemo(() => STATUS_CONFIG[quiz.status], [quiz.status]);

  const handlePublish = useCallback(() => {
    publishMutation.mutate(quiz.id, {
      onSuccess: () =>
        toast.success("Quiz published! Students can now take it."),
      onError: (err) => toast.error(err.message || "Failed to publish quiz."),
    });
  }, [publishMutation, quiz.id]);

  const handleClose = useCallback(() => {
    closeMutation.mutate(quiz.id, {
      onSuccess: () => toast.success("Quiz closed."),
      onError: (err) => toast.error(err.message || "Failed to close quiz."),
    });
  }, [closeMutation, quiz.id]);

  const handleRelease = useCallback(() => {
    releaseResultsMutation.mutate(quiz.id, {
      onSuccess: () => toast.success("Results are now visible to students!"),
      onError: (err) =>
        toast.error(err.message || "Failed to release results."),
    });
  }, [releaseResultsMutation, quiz.id]);

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="flex flex-col gap-3 p-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <Badge
            variant="outline"
            className="text-xs capitalize shrink-0 border-border text-muted-foreground"
          >
            {quiz.category?.name ?? "Uncategorized"}
          </Badge>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize shrink-0",
              statusCfg.badge,
            )}
          >
            {statusCfg.label}
          </span>
        </div>

        <div>
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-bold text-base text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {quiz.title}
            </h3>
            {quiz.results_visible && (
              <Link
                href={`/dashboard/quiz/${quiz.id}/leaderboard`}
                className="inline-flex h-7 items-center gap-1.5 rounded-md border border-yellow-200 bg-yellow-50/30 px-2.5 text-xs font-medium text-yellow-700 hover:bg-yellow-50 transition-colors shrink-0"
              >
                <Trophy className="h-3.5 w-3.5" />
                Leaderboard
              </Link>
            )}
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 h-10">
            {quiz.description || "No description provided."}
          </p>
          {quiz.creator && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px]">
              <span className="text-muted-foreground">Created by:</span>
              <span className="font-medium text-foreground">{quiz.creator.name}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mx-5 mb-4 grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3 border border-border/60">
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Layers className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-bold text-foreground">
            {quiz.total_marks}
          </span>
          <span className="text-[10px] text-muted-foreground leading-none">
            marks
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 border-x border-border/60">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-bold text-foreground">
            {quiz.time_limit_minutes ?? "∞"}
          </span>
          <span className="text-[10px] text-muted-foreground leading-none">
            {quiz.time_limit_minutes ? "mins" : "unlimited"}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Star className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-bold text-foreground">
            {quiz.pass_mark}%
          </span>
          <span className="text-[10px] text-muted-foreground leading-none">
            pass mark
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5 pb-4 pt-3 border-t border-border/60 mt-auto w-full">
        <Link
          href={`/admin/quiz/${quiz.id}`}
          className="flex-1 min-w-[120px] inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground shadow-sm hover:bg-accent transition-colors"
        >
          <Settings className="h-3.5 w-3.5 shrink-0" />
          <span>Edit Builder</span>
        </Link>

        {quiz.status !== "draft" && (
          <Link
            href={`/admin/quiz/${quiz.id}/submissions`}
            className="flex-1 min-w-[120px] inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground shadow-sm hover:bg-accent transition-colors"
          >
            <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>Submissions</span>
          </Link>
        )}

        {quiz.status === "draft" && (
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={publishMutation.isPending}
            className="flex-1 min-w-[120px] h-8 gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white justify-center"
          >
            {publishMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            ) : (
              <Rocket className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>{publishMutation.isPending ? "Publishing..." : "Publish"}</span>
          </Button>
        )}

        {quiz.status === "published" && (
          <Button
            size="sm"
            variant="destructive"
            onClick={handleClose}
            disabled={closeMutation.isPending}
            className="flex-1 min-w-[120px] h-8 gap-1.5 text-xs justify-center"
          >
            {closeMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            ) : (
              <Lock className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>{closeMutation.isPending ? "Closing..." : "Close"}</span>
          </Button>
        )}

        {quiz.status !== "draft" && !quiz.results_visible && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRelease}
            disabled={releaseResultsMutation.isPending}
            className="flex-1 min-w-[120px] h-8 gap-1.5 text-xs border-border hover:bg-accent justify-center"
          >
            {releaseResultsMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            ) : (
              <Eye className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>
              {releaseResultsMutation.isPending ? "Releasing..." : "Release Results"}
            </span>
          </Button>
        )}

        {(quiz.status === "draft" || quiz.status === "closed") && (
          <ConfirmDialog
            title="Delete Quiz"
            description={`Are you sure you want to delete the quiz "${quiz.title}"? This will permanently delete the quiz, its questions, and all student attempts.`}
            onConfirm={() => {
              deleteQuizMutation.mutate(quiz.id, {
                onSuccess: () => toast.success("Quiz deleted successfully."),
                onError: (err) =>
                  toast.error(err.message || "Failed to delete quiz."),
              });
            }}
            confirmText="Delete"
            cancelText="Cancel"
            variant="destructive"
            isLoading={deleteQuizMutation.isPending}
            loadingText="Deleting..."
            trigger={
              <Button
                size="sm"
                variant="outline"
                className="flex-1 min-w-[120px] h-8 gap-1.5 text-xs border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 justify-center"
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0" />
                <span>Delete Quiz</span>
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
});

export default QuizCard;
