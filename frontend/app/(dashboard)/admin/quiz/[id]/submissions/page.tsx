import React from "react";
import ReviewHeader from "@/components/review/ReviewHeader";
import SubmissionsTableClient from "@/components/review/SubmissionsTableClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminQuizSubmissionsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const quizId = Number(resolvedParams.id);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <ReviewHeader
        title="Student Submissions"
        subtitle="View and grade students who have completed the quiz."
        backUrl="/admin"
      />

      <SubmissionsTableClient quizId={quizId} />
    </div>
  );
}
