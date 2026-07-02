import React from "react";
import ReviewHeader from "@/components/review/ReviewHeader";
import AttemptReviewContainerClient from "@/components/review/AttemptReviewContainerClient";

interface PageProps {
  params: Promise<{ id: string; attemptId: string }>;
}

export default async function AdminAttemptReviewPage({ params }: PageProps) {
  const resolvedParams = await params;
  const quizId = Number(resolvedParams.id);
  const attemptId = Number(resolvedParams.attemptId);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <ReviewHeader
        title="Submission Review"
        subtitle="Reviewing answers submitted by student."
        backUrl={`/admin/quiz/${quizId}/submissions`}
      />

      <AttemptReviewContainerClient
        quizId={quizId}
        attemptId={attemptId}
        isAdmin={true}
      />
    </div>
  );
}
