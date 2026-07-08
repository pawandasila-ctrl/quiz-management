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
import {
  Timer,
  Award,
  Trophy,
  FileText,
  CheckCircle2,
  Play,
  Sparkles,
} from "lucide-react";
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
    <Card className="border border-border/80 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden rounded-2xl bg-card hover:-translate-y-0.5 border-t-4 border-t-primary/70">
      {/* Header */}
      <CardHeader className="p-6 pb-4.5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge
            variant="outline"
            className="text-[10px] font-bold tracking-wider uppercase border-primary/10 bg-primary/5 text-primary px-2.5 py-0.5 rounded-full"
          >
            {quiz.category?.name || "Uncategorized"}
          </Badge>
          <Badge
            variant={
              activeAttempt
                ? "default"
                : hasRemainingAttempts
                  ? "outline"
                  : "secondary"
            }
            className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border-none ${
              activeAttempt
                ? "bg-amber-500 text-white animate-pulse"
                : hasRemainingAttempts
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-emerald-500/10 text-emerald-600"
            }`}
          >
            {activeAttempt ? (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                Active Attempt
              </span>
            ) : hasRemainingAttempts ? (
              `Attempts: ${attemptsCount}/${quiz.max_attempts || "∞"}`
            ) : (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Completed
              </span>
            )}
          </Badge>
        </div>
        <CardTitle className="text-base font-bold tracking-tight text-foreground line-clamp-1">
          {quiz.title}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-xs text-muted-foreground mt-1 h-9.5 leading-relaxed">
          {quiz.description || "No description provided."}
        </CardDescription>
      </CardHeader>

      {/* Content */}
      <CardContent className="px-6 py-4.5 space-y-3.5 text-xs border-y border-border/40 bg-muted/5">
        <div className="flex items-center justify-between text-muted-foreground font-medium">
          <span className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground/60" />
            Time Limit
          </span>
          <span className="font-bold text-foreground">
            {quiz.time_limit_minutes
              ? `${quiz.time_limit_minutes} mins`
              : "Unlimited"}
          </span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground font-medium">
          <span className="flex items-center gap-2">
            <Award className="h-4 w-4 text-muted-foreground/60" />
            Total Marks
          </span>
          <span className="font-bold text-foreground">
            {quiz.total_marks} Marks
          </span>
        </div>
        {quiz.results_visible && highestScore !== null && (
          <div className="flex items-center justify-between text-muted-foreground pt-0.5 font-medium border-t border-border/30 mt-2">
            <span className="flex items-center gap-2 text-primary font-bold">
              <Sparkles className="h-4 w-4" />
              Highest Score
            </span>
            <Badge
              variant="outline"
              className="font-extrabold text-primary border-primary/25 bg-primary/10 text-[10px] px-2 py-0.5 rounded-md"
            >
              {highestScore} / {quiz.total_marks}
            </Badge>
          </div>
        )}
      </CardContent>

      {/* Footer */}
      <CardFooter className="p-4 flex flex-row gap-2.5 bg-linear-to-t from-muted/10 to-transparent">
        {activeAttempt ? (
          <Button
            onClick={() => router.push(`/quiz/${quiz.id}`)}
            className="flex-1 min-w-0 font-bold text-xs h-9 rounded-xl shadow-sm bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
          >
            <Play className="h-3.5 w-3.5 fill-current" /> Continue Attempt
          </Button>
        ) : quiz.results_visible && latestGradedAttempt ? (
          <Button
            variant="outline"
            onClick={() =>
              router.push(
                `/dashboard/quiz/${quiz.id}/attempt/${latestGradedAttempt.id}`,
              )
            }
            className="flex-1 min-w-0 font-bold text-xs h-9 gap-1.5 border-border hover:bg-accent rounded-xl"
          >
            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">Review Results</span>
          </Button>
        ) : hasRemainingAttempts ? (
          <Button
            onClick={() => router.push(`/quiz/${quiz.id}`)}
            className="flex-1 min-w-0 font-bold text-xs h-9 rounded-xl shadow-sm gap-1.5"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span className="truncate">
              {latestAttempt ? "Start New" : "Start Quiz"}
            </span>
          </Button>
        ) : (
          <Badge
            variant="outline"
            className="flex-1 min-w-0 items-center justify-center py-2 text-xs font-bold text-muted-foreground border-border/80 rounded-xl bg-muted/10"
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
            className="flex-1 min-w-0 font-bold text-xs h-9 gap-1.5 border-border hover:bg-accent rounded-xl"
          >
            <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            <span className="truncate">Leaderboard</span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
