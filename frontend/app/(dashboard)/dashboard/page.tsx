import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import StudentQuizList from "./_components/StudentQuizList";
import { serverFetch } from "@/lib/server-api";
import { Quiz, QuizAttempt } from "@/modules/quiz/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Student Portal — Quiz System",
  description: "Browse published quizzes, take assessments, and review results.",
};

export default async function StudentDashboardPage() {
  // Parallel server-side pre-fetching to eliminate client waterfalls
  const [initialQuizzes, initialAttempts] = await Promise.all([
    serverFetch<Quiz[]>("/student/quiz"),
    serverFetch<QuizAttempt[]>("/student/attempts"),
  ]);

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

      <StudentQuizList
        initialQuizzes={initialQuizzes || undefined}
        initialAttempts={initialAttempts || undefined}
      />
    </div>
  );
}
