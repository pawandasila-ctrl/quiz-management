import React from "react";
import AdminQuizSubmissionsClient from "./_components/submissions-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminQuizSubmissionsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const quizId = Number(resolvedParams.id);

  return <AdminQuizSubmissionsClient quizId={quizId} />;
}
