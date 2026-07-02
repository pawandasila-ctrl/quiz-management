"use client";

import React from "react";
import Link from "next/link";
import { useStudentQuizzes, useStudentAttempts } from "@/models/quiz/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ClipboardCheck } from "lucide-react";
import StudentQuizCard from "@/models/quiz/components/student-quiz-card";

export default function StudentDashboard() {
  const { data: quizzes, isLoading: isQuizzesLoading, error: quizzesError } = useStudentQuizzes();
  const { data: attempts, isLoading: isAttemptsLoading } = useStudentAttempts();

  const isLoading = isQuizzesLoading || isAttemptsLoading;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (quizzesError) {
    return (
      <Card className="border-destructive bg-destructive/5 text-destructive p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6" />
          <div>
            <h3 className="font-semibold text-lg">Error loading quizzes</h3>
            <p className="text-sm">Please refresh the page or contact support.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome to the Quiz Portal
          </h2>
          <p className="text-sm text-muted-foreground">
            Browse through the published quizzes, view your previous logs, and test your knowledge.
          </p>
        </div>
        <div>
          <Link href="/dashboard/my-quizzes">
            <Button size="sm">View My Quizzes</Button>
          </Link>
        </div>
      </div>

      {!quizzes || quizzes.length === 0 ? (
        <Card className="border-dashed border-border py-12 text-center">
          <CardContent className="space-y-3">
            <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="font-semibold text-lg text-foreground">No Quizzes Available</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              There are currently no published quizzes. Check back later or ask your administrator.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <StudentQuizCard
              key={quiz.id}
              quiz={quiz}
              attempts={attempts || []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
