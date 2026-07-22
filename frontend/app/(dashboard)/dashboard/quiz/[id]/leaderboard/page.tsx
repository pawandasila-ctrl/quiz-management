import type { Metadata } from "next";
import React from "react";
import QuizLeaderboard from "./_components/quiz-leaderboard";
import { serverFetch } from "@/lib/server-api";
import { Quiz, LeaderboardEntry } from "@/modules/quiz/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Leaderboard Quiz #${resolvedParams.id} — Quiz System`,
    description:
      "Compare scores and time elapsed with other top-performing students.",
  };
}

export default async function StudentLeaderboardRoute({ params }: PageProps) {
  const resolvedParams = await params;
  const quizId = Number(resolvedParams.id);

  const [initialQuiz, initialLeaderboard] = await Promise.all([
    serverFetch<Quiz>(`/student/quiz/${quizId}`),
    serverFetch<LeaderboardEntry[]>(`/student/quiz/${quizId}/leaderboard`),
  ]);

  return (
    <QuizLeaderboard
      quizId={quizId}
      initialQuiz={initialQuiz || undefined}
      initialLeaderboard={initialLeaderboard || undefined}
    />
  );
}
