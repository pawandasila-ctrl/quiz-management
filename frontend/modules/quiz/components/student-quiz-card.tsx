import React from "react";
import { Quiz, QuizAttempt } from "../types";
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
import { Timer, Award, Trophy, FileText } from "lucide-react";
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
    <Card className="border-border shadow-sm flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <Badge
            variant="outline"
            className="text-xs border-border capitalize bg-accent/20 text-muted-foreground"
          >
            {quiz.category?.name || "Uncategorized"}
          </Badge>
          <Badge
            variant={
              hasRemainingAttempts || activeAttempt ? "default" : "secondary"
            }
            className="text-xs shrink-0"
          >
            {activeAttempt
              ? "Attempt Active"
              : hasRemainingAttempts
                ? `Attempts: ${attemptsCount}/${quiz.max_attempts}`
                : "Completed"}
          </Badge>
        </div>
        <CardTitle className="text-base font-bold tracking-tight text-foreground line-clamp-1">
          {quiz.title}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-xs text-muted-foreground mt-1 h-9">
          {quiz.description || "No description provided."}
        </CardDescription>
      </CardHeader>

      {/* Content - clean borders and spacing */}
      <CardContent className="px-5 py-3.5 space-y-2.5 text-xs border-y border-border/70">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium">
            <Timer className="h-3.5 w-3.5 text-muted-foreground/80" />
            Time Limit
          </span>
          <span className="font-semibold text-foreground">
            {quiz.time_limit_minutes
              ? `${quiz.time_limit_minutes} mins`
              : "Unlimited"}
          </span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium">
            <Award className="h-3.5 w-3.5 text-muted-foreground/80" />
            Total Marks
          </span>
          <span className="font-semibold text-foreground">
            {quiz.total_marks} Marks
          </span>
        </div>
        {quiz.results_visible && highestScore !== null && (
          <div className="flex items-center justify-between text-muted-foreground pt-0.5">
            <span className="font-medium">Highest Score</span>
            <Badge
              variant="outline"
              className="font-bold text-primary border-primary/20 bg-primary/5 text-[10px]"
            >
              {highestScore} / {quiz.total_marks}
            </Badge>
          </div>
        )}
      </CardContent>

      {/* Footer */}
      <CardFooter className="p-3 flex flex-row gap-2">
        {activeAttempt ? (
          <Button
            onClick={() => router.push(`/quiz/${quiz.id}`)}
            className="flex-1 min-w-0 font-semibold text-xs h-8.5"
          >
            Continue Attempt
          </Button>
        ) : quiz.results_visible && latestGradedAttempt ? (
          <Button
            variant="outline"
            onClick={() =>
              router.push(
                `/dashboard/quiz/${quiz.id}/attempt/${latestGradedAttempt.id}`,
              )
            }
            className="flex-1 min-w-0 font-semibold text-xs h-8.5 gap-1.5 border-border hover:bg-accent"
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Review Latest Results</span>
          </Button>
        ) : hasRemainingAttempts ? (
          <Button
            onClick={() => router.push(`/quiz/${quiz.id}`)}
            className="flex-1 min-w-0 font-semibold text-xs h-8.5"
          >
            {latestAttempt ? "Start New Attempt" : "Start Quiz"}
          </Button>
        ) : (
          <Badge
            variant="outline"
            className="flex-1 min-w-0 items-center justify-center py-2 text-xs"
          >
            Awaiting Results
          </Badge>
        )}

        {quiz.results_visible && gradedAttempts.length > 0 && (
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/quiz/${quiz.id}/leaderboard`)
            }
            className="flex-1 min-w-0 font-semibold text-xs h-8.5 gap-1.5 border-border hover:bg-accent"
          >
            <Trophy className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
            <span className="truncate">View Leaderboard</span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
