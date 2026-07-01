import React from "react";
import QuizBuilder from "./_components/quiz-builder";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminQuizBuilderPage({ params }: PageProps) {
  const resolvedParams = await params;
  const quizId = Number(resolvedParams.id);

  return <QuizBuilder quizId={quizId} />;
}
