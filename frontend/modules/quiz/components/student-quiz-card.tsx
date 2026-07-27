import React from "react";
import { Quiz, QuizAttempt } from "../types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Timer, Award, Trophy, FileText, Play } from "lucide-react";
import { useRouter } from "next/navigation";

interface StudentQuizCardProps {
  quiz: Quiz;
  attempts: QuizAttempt[];
}

export default function StudentQuizCard({
  quiz,
  attempts,
}: StudentQuizCardProps) {
  const router = useRouter();

  const quizAttempts = attempts.filter((att) => att.quiz_id === quiz.id);
  const activeAttempt = attempts.find(
    (att) => att.quiz_id === quiz.id && att.status === "in_progress",
  );

  const latestAttempt =
    quizAttempts.length > 0 ? quizAttempts[quizAttempts.length - 1] : null;

  const attemptsCount = quizAttempts.length;
  const hasRemainingAttempts =
    quiz.max_attempts === 0 || attemptsCount < quiz.max_attempts;

  const gradedAttempts = quizAttempts.filter((a) => a.status === "graded");
  const latestGradedAttempt =
    gradedAttempts.length > 0
      ? gradedAttempts.reduce(
          (latest, current) =>
            current.attempt_number > latest.attempt_number ? current : latest,
          gradedAttempts[0],
        )
      : null;
  const highestScore =
    gradedAttempts.length > 0
      ? Math.max(...gradedAttempts.map((a) => a.score || 0))
      : null;

  return (
    <Card className="group flex flex-col border border-border/80 rounded-2xl shadow-sm hover:shadow-xl hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 bg-card overflow-hidden">
      {/* Header */}
      <CardHeader className="p-5 pb-3 space-y-2.5 bg-linear-to-b from-accent/30 to-transparent">
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="outline"
            className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 border-primary/20 bg-primary/5 text-primary"
          >
            {quiz.category?.name || "General"}
          </Badge>
          {activeAttempt ? (
            <Badge className="text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2.5 py-0.5">
              Active Session
            </Badge>
          ) : !hasRemainingAttempts ? (
            <Badge
              variant="secondary"
              className="text-[10px] font-semibold text-muted-foreground"
            >
              Completed
            </Badge>
          ) : (
            <span className="text-[11px] font-medium text-muted-foreground font-mono">
              {attemptsCount}/{quiz.max_attempts || "∞"} attempts
            </span>
          )}
        </div>
        <CardTitle className="text-base font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {quiz.title}
        </CardTitle>
        {quiz.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {quiz.description}
          </p>
        )}
      </CardHeader>

      {/* Metadata */}
      <CardContent className="px-5 py-3 border-t border-border/60 space-y-2 bg-muted/20">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium">
            <Timer className="h-3.5 w-3.5 text-primary" />
            Time Limit
          </span>
          <span className="font-semibold text-foreground font-mono">
            {quiz.time_limit_minutes
              ? `${quiz.time_limit_minutes} min`
              : "Unlimited"}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium">
            <Award className="h-3.5 w-3.5 text-indigo-500" />
            Total Marks
          </span>
          <span className="font-semibold text-foreground font-mono">
            {quiz.total_marks} Marks
          </span>
        </div>
        {quiz.results_visible && highestScore !== null && (
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/60 pt-2 mt-1">
            <span className="font-medium text-slate-400">Best Score</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {highestScore} / {quiz.total_marks}
            </span>
          </div>
        )}
      </CardContent>

      {/* Footer */}
      <CardFooter className="p-4 mt-auto flex gap-2 border-t border-border/80 bg-card">
        {activeAttempt ? (
          <Button
            size="sm"
            className="flex-1 text-xs font-semibold gap-1.5 h-9 bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
            onClick={() => router.push(`/quiz/${quiz.id}`)}
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Resume Quiz
          </Button>
        ) : quiz.results_visible && latestGradedAttempt ? (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs font-semibold gap-1.5 h-9 border-border hover:bg-accent"
            onClick={() =>
              router.push(
                `/dashboard/quiz/${quiz.id}/attempt/${latestGradedAttempt.id}`,
              )
            }
          >
            <FileText className="h-3.5 w-3.5 text-primary" />
            Review Results
          </Button>
        ) : hasRemainingAttempts ? (
          <Button
            size="sm"
            className="flex-1 text-xs font-semibold gap-1.5 h-9 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            onClick={() => router.push(`/quiz/${quiz.id}`)}
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            {latestAttempt ? "Retake Quiz" : "Start Assessment"}
          </Button>
        ) : (
          <span className="flex-1 text-center text-xs font-medium text-muted-foreground py-1">
            Awaiting Results
          </span>
        )}

        {quiz.results_visible && gradedAttempts.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs font-semibold gap-1.5 h-9 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
            onClick={() =>
              router.push(`/dashboard/quiz/${quiz.id}/leaderboard`)
            }
          >
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            Leaderboard
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
