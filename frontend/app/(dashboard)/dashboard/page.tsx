import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import StudentQuizList from "./_components/StudentQuizList";
import { serverFetch } from "@/lib/server-api";
import { Quiz, QuizAttempt, PaginatedResponse } from "@/modules/quiz/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Student Portal — Quiz System",
  description: "Browse published quizzes, take assessments, and review results.",
};

export default async function StudentDashboardPage() {
  // Parallel server-side pre-fetching to eliminate client waterfalls
  const [initialQuizzes, initialAttempts] = await Promise.all([
    serverFetch<PaginatedResponse<Quiz>>("/student/quiz"),
    serverFetch<QuizAttempt[]>("/student/attempts"),
  ]);

  return (
    <div className="space-y-8 animate-fade-in duration-300">
      {/* Hero Banner with Thesis Headline */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Student Learning Hub
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Master Your Skills Through Active Testing
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Explore available assessments, review detailed breakdown results, and challenge yourself on the global leaderboard.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Link href="/dashboard/my-quizzes">
              <Button
                size="default"
                className="font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 h-10 px-5 text-xs sm:text-sm"
              >
                View My History
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <StudentQuizList
        initialQuizzes={initialQuizzes || undefined}
        initialAttempts={initialAttempts || undefined}
      />
    </div>
  );
}
