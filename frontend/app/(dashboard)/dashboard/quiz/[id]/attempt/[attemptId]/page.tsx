import React from "react";
import StudentAttemptReviewClient from "./_components/attempt-review-client";

interface PageProps {
  params: Promise<{ id: string; attemptId: string }>;
}

export default async function StudentAttemptReviewPage({ params }: PageProps) {
  const resolvedParams = await params;
  const quizId = Number(resolvedParams.id);
  const attemptId = Number(resolvedParams.attemptId);

  return <StudentAttemptReviewClient quizId={quizId} attemptId={attemptId} />;
}
