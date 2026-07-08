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
    <Card className="flex flex-col border border-border rounded-xl gap-2 shadow-sm hover:shadow-md transition-shadow duration-200 bg-card">
      {/* Header */}
      <CardHeader className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {quiz.category?.name || "Uncategorized"}
          </span>
          {activeAttempt ? (
            <Badge className="text-[10px] font-semibold bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">
              Active
            </Badge>
          ) : !hasRemainingAttempts ? (
            <Badge variant="secondary" className="text-[10px] font-semibold">
              Completed
            </Badge>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              {attemptsCount}/{quiz.max_attempts || "∞"} attempts
            </span>
          )}
        </div>
        <CardTitle className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
          {quiz.title}
        </CardTitle>
        {quiz.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {quiz.description}
          </p>
        )}
      </CardHeader>

      {/* Metadata */}
      <CardContent className="px-5 py-2.5 border-t border-border space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Timer className="h-3.5 w-3.5" />
            Time Limit
          </span>
          <span className="font-medium text-foreground">
            {quiz.time_limit_minutes
              ? `${quiz.time_limit_minutes} min`
              : "Unlimited"}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5" />
            Total Marks
          </span>
          <span className="font-medium text-foreground">
            {quiz.total_marks}
          </span>
        </div>
        {quiz.results_visible && highestScore !== null && (
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-1.5">
            <span>Best Score</span>
            <span className="font-semibold text-foreground">
              {highestScore} / {quiz.total_marks}
            </span>
          </div>
        )}
      </CardContent>

      {/* Footer */}
      <CardFooter className="px-5 py-2 mt-auto flex gap-2 border-t border-border">
        {activeAttempt ? (
          <Button
            size="sm"
            className="flex-1 text-xs gap-1.5 h-8"
            onClick={() => router.push(`/quiz/${quiz.id}`)}
          >
            <Play className="h-3 w-3 fill-current" />
            Continue
          </Button>
        ) : quiz.results_visible && latestGradedAttempt ? (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs gap-1.5 h-8"
            onClick={() =>
              router.push(
                `/dashboard/quiz/${quiz.id}/attempt/${latestGradedAttempt.id}`,
              )
            }
          >
            <FileText className="h-3 w-3" />
            Review Results
          </Button>
        ) : hasRemainingAttempts ? (
          <Button
            size="sm"
            className="flex-1 text-xs gap-1.5 h-8"
            onClick={() => router.push(`/quiz/${quiz.id}`)}
          >
            <Play className="h-3 w-3 fill-current" />
            {latestAttempt ? "New Attempt" : "Start Quiz"}
          </Button>
        ) : (
          <span className="flex-1 text-center text-xs text-muted-foreground py-1">
            Awaiting results
          </span>
        )}

        {quiz.results_visible && gradedAttempts.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs gap-1.5 h-8"
            onClick={() =>
              router.push(`/dashboard/quiz/${quiz.id}/leaderboard`)
            }
          >
            <Trophy className="h-3 w-3 text-amber-500" />
            Leaderboard
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
