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
    title: `Review Attempt #${resolvedParams.attemptId} — Quiz System`,
    description: "Detailed review of answers, correctness, and point breakdown.",
  };
}

export default async function StudentAttemptReviewPage({ params }: PageProps) {
  const resolvedParams = await params;
  const quizId = Number(resolvedParams.id);
  const attemptId = Number(resolvedParams.attemptId);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <ReviewHeader
        title="Quiz Results Review"
        backUrl="/dashboard"
      />

      <AttemptReviewContainerClient
        quizId={quizId}
        attemptId={attemptId}
        isAdmin={false}
      />
    </div>
  );
}
