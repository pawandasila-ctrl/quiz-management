import type { Metadata } from "next";
import React from "react";
import QuizLeaderboard from "./_components/quiz-leaderboard";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Leaderboard Quiz #${resolvedParams.id} — Quiz System`,
    description: "Compare scores and time elapsed with other top-performing students.",
  };
}

export default async function StudentLeaderboardRoute({ params }: PageProps) {
  const resolvedParams = await params;
  const quizId = Number(resolvedParams.id);

  return <QuizLeaderboard quizId={quizId} />;
}
