import type { Metadata } from "next";
import CreateQuizButton from "./_components/CreateQuizButton";
import AdminQuizList from "./_components/AdminQuizList";

export const metadata: Metadata = {
  title: "Admin Console — Quiz Library",
  description: "Manage exam papers, published results, and build quizzes.",
};

export default function AdminPage() {
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

      <AdminQuizList />
    </div>
  );
}
