import React from "react";
import QuizLeaderboard from "./_components/quiz-leaderboard";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentLeaderboardRoute({ params }: PageProps) {
  const resolvedParams = await params;
  const quizId = Number(resolvedParams.id);

  return <QuizLeaderboard quizId={quizId} />;
}
