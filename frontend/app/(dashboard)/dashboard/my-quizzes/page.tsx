import type { Metadata } from "next";
import Link from "next/link";
import AttemptHistoryList from "./_components/AttemptHistoryList";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Attempt History — Quiz System",
  description: "View all your past quiz attempt logs, grades, and detailed results.",
};

export default function MyQuizzesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 px-1 py-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            My Quizzes
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Attempt History
          </h1>
          <p className="text-sm text-muted-foreground max-w-md">
            Track every quiz you started, see your scores, full attempt status,
            and jump to review when results are released.
          </p>
        </div>
        <Link href="/dashboard" className="shrink-0 mt-1">
          <Button variant="outline" size="sm">
            View Available Quizzes
          </Button>
        </Link>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Attempt List */}
      <AttemptHistoryList />
    </div>
  );
}
