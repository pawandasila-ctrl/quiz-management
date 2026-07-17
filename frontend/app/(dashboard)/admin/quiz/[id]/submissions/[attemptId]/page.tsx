import type { Metadata } from "next";
import React from "react";
import ReviewHeader from "@/components/review/ReviewHeader";
import AttemptReviewContainerClient from "@/components/review/AttemptReviewContainerClient";

interface PageProps {
  params: Promise<{ id: string; attemptId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Auditing Attempt #${resolvedParams.attemptId} — Admin`,
    description: "Detailed review of answers submitted by the student.",
  };
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
