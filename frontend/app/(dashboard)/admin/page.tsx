import type { Metadata } from "next";
import CreateQuizButton from "./_components/CreateQuizButton";
import AdminQuizList from "./_components/AdminQuizList";
import { serverFetch } from "@/lib/server-api";
import { Quiz, PaginatedResponse } from "@/modules/quiz/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Console — Quiz Library",
  description: "Manage exam papers, published results, and build quizzes.",
};

export default async function AdminPage() {
  const initialQuizzes = await serverFetch<PaginatedResponse<Quiz>>("/admin/quiz");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Quiz Library</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your exam papers and published results.
          </p>
        </div>
        <CreateQuizButton />
      </div>

      <AdminQuizList initialQuizzes={initialQuizzes || undefined} />
    </div>
  );
}
