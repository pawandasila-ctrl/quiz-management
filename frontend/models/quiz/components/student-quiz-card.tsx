"use client";

import React from "react";
import { useStartQuizAttempt } from "../hooks";
import { Quiz, QuizAttempt } from "../types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Timer, Award, RefreshCw, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface StudentQuizCardProps {
  quiz: Quiz;
  attempts: QuizAttempt[];
}

export default function StudentQuizCard({ quiz, attempts }: StudentQuizCardProps) {
  const router = useRouter();
  const startQuizMutation = useStartQuizAttempt();

  const quizAttempts = attempts.filter((att) => att.quiz_id === quiz.id);
  const activeAttempt = attempts.find(
    (att) => att.quiz_id === quiz.id && att.status === "in_progress"
  );

  const attemptsCount = quizAttempts.length;
  const hasRemainingAttempts = quiz.max_attempts === 0 || attemptsCount < quiz.max_attempts;

  const gradedAttempts = quizAttempts.filter((a) => a.status === "graded");
  const highestScore = gradedAttempts.length > 0
    ? Math.max(...gradedAttempts.map((a) => a.score || 0))
    : null;

  return (
    <Card className="border-border shadow-sm flex flex-col justify-between">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <Badge variant="outline" className="text-xs border-border capitalize bg-accent/20">
            {quiz.category?.name || "Uncategorized"}
          </Badge>
          <Badge
            variant={hasRemainingAttempts || activeAttempt ? "default" : "secondary"}
            className="text-xs"
          >
            {activeAttempt
              ? "Attempt Active"
              : hasRemainingAttempts
              ? `Attempts: ${attemptsCount}/${quiz.max_attempts}`
              : "Completed"}
          </Badge>
        </div>
        <CardTitle className="text-lg font-semibold tracking-tight text-foreground line-clamp-1">
          {quiz.title}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-sm text-muted-foreground mt-1.5 h-10">
          {quiz.description || "No description provided."}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-4 space-y-3 text-sm border-t border-b border-border py-4 my-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Timer className="h-4 w-4" />
            Time Limit
          </span>
          <span className="font-medium text-foreground">
            {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} mins` : "Unlimited"}
          </span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Award className="h-4 w-4" />
            Total Marks
          </span>
          <span className="font-medium text-foreground">
            {quiz.total_marks} Marks
          </span>
        </div>
        {highestScore !== null && (
          <div className="flex items-center justify-between text-muted-foreground pt-1">
            <span>Highest Score</span>
            <Badge variant="outline" className="font-semibold text-primary border-primary/20 bg-primary/5">
              {highestScore} / {quiz.total_marks}
            </Badge>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4 flex flex-col gap-2">
        {activeAttempt ? (
          <Button
            onClick={() => router.push(`/dashboard/quiz/${quiz.id}`)}
            className="w-full font-medium"
          >
            Continue Attempt
          </Button>
        ) : hasRemainingAttempts ? (
          <Button
            onClick={() =>
              startQuizMutation.mutate(quiz.id, {
                onSuccess: () => {
                  toast.success("Attempt started!");
                  router.push(`/dashboard/quiz/${quiz.id}`);
                },
                onError: (err) => {
                  toast.error(err.message || "Failed to start quiz attempt.");
                },
              })
            }
            className="w-full font-medium"
            disabled={startQuizMutation.isPending}
          >
            {startQuizMutation.isPending && startQuizMutation.variables === quiz.id ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Starting...
              </span>
            ) : attemptsCount > 0 ? (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Retake Quiz
              </span>
            ) : (
              "Start Quiz"
            )}
          </Button>
        ) : (
          <Button variant="secondary" className="w-full cursor-not-allowed font-medium" disabled>
            Max Attempts Reached
          </Button>
        )}

        {quiz.results_visible && gradedAttempts.length > 0 && (
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/quiz/${quiz.id}/leaderboard`)}
            className="w-full font-medium gap-1.5 border-border hover:bg-accent"
          >
            <Trophy className="h-3.5 w-3.5 text-yellow-500" />
            View Leaderboard
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
