import React from "react";
import { cookies } from "next/headers";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import ReviewHeader from "@/components/review/ReviewHeader";
import ReviewScorecard from "@/components/review/ReviewScorecard";
import QuestionReviewList from "@/components/review/QuestionReviewList";
import { Quiz, QuizAttempt } from "@/models/quiz/types";

interface PageProps {
  params: Promise<{ id: string; attemptId: string }>;
}

async function fetchFromBackend<T>(endpoint: string): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
  const res = await fetch(`${apiUrl}${endpoint}`, {
    headers: {
      "Cookie": cookieHeader,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${res.statusText}`);
  }
  return res.json();
}

export default async function StudentAttemptReviewPage({ params }: PageProps) {
  const resolvedParams = await params;
  const quizId = Number(resolvedParams.id);
  const attemptId = Number(resolvedParams.attemptId);

  let quiz: Quiz | null = null;
  let attempt: QuizAttempt | null = null;
  let errorMsg: string | null = null;

  try {
    quiz = await fetchFromBackend<Quiz>(`/student/quiz/${quizId}`);
    if (quiz.results_visible) {
      attempt = await fetchFromBackend<QuizAttempt>(`/student/attempt/${attemptId}/result`);
    }
  } catch (err: any) {
    errorMsg = err.message || "Failed to load attempt details";
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center text-destructive">
        <AlertCircle className="h-10 w-10" />
        <p className="font-semibold">Quiz not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <ReviewHeader
        title={`Quiz Results Review - ${quiz.title}`}
        backUrl="/dashboard"
      />

      <Card className="border-border shadow-sm flex flex-col overflow-hidden">
        <CardContent className="p-6 space-y-6">
          {!quiz.results_visible ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-border rounded-xl bg-muted/20 text-center gap-2">
              <AlertCircle className="h-8 w-8 text-muted-foreground/60 animate-pulse" />
              <p className="text-sm font-semibold text-foreground">Results Not Released</p>
              <p className="text-xs text-muted-foreground max-w-sm leading-normal">
                Quiz results have not been released by the admin yet. Please check back later.
              </p>
            </div>
          ) : errorMsg || !attempt ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
              <p className="font-semibold text-foreground">No attempt data available</p>
            </div>
          ) : (
            <div className="space-y-6">
              <ReviewScorecard
                score={attempt.score ?? 0}
                totalMarks={quiz.total_marks}
                passed={!!attempt.passed}
                timeTakenSeconds={attempt.time_taken_seconds}
              />
              <QuestionReviewList
                answers={attempt.answers || []}
                isAdmin={false}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
