import Link from "next/link";
import AttemptHistoryList from "./_components/AttemptHistoryList";

export default function MyQuizzesPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[.24em] text-muted-foreground">
              My Quizzes
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Attempt History
            </h1>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent"
          >
            View Available Quizzes
          </Link>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Track every quiz you started, see your scores, full attempt status,
          and jump to review when results are released.
        </p>
      </div>

      <AttemptHistoryList />
    </div>
  );
}
