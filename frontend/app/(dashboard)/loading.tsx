import { QuizGridSkeleton } from "@/modules/quiz/components/QuizCardSkeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <QuizGridSkeleton count={6} />
    </div>
  );
}
