import type { Metadata } from "next";
import CreateQuizButton from "./_components/CreateQuizButton";
import AdminQuizList from "./_components/AdminQuizList";
import { serverFetch } from "@/lib/server-api";
import { Quiz, PaginatedResponse } from "@/modules/quiz/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Console — Quiz Library",
  description: "Manage exam papers, published results, and build quizzes.",
};

export default async function AdminPage() {
  const initialQuizzes =
    await serverFetch<PaginatedResponse<Quiz>>("/admin/quiz");

  return (
    <div className="space-y-8 animate-fade-in duration-300">
      {/* Admin Hero Header using Shadcn Card */}
      <Card className="relative overflow-hidden rounded-3xl border-primary/20 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-950 text-white shadow-xl">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />

        <CardContent className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <Badge
              variant="outline"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 border-indigo-500/30"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Admin Assessment Engine
            </Badge>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Quiz & Examination Library
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Design new quizzes, manage question banks, review student
              submissions, and publish leaderboard scores.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <CreateQuizButton />
          </div>
        </CardContent>
      </Card>

      <AdminQuizList initialQuizzes={initialQuizzes || undefined} />
    </div>
  );
}
