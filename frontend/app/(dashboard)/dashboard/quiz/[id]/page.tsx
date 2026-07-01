import React from "react";
import QuizSession from "./_components/quiz-session";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentQuizPage({ params }: PageProps) {
  const resolvedParams = await params;
  const quizId = Number(resolvedParams.id);

  return <QuizSession quizId={quizId} />;
}
