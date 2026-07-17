import type { Metadata } from "next";
import React from "react";
import QuizSession from "./_components/quiz-session";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Quiz Assessment #${resolvedParams.id} — Quiz System`,
    description: "Enter secure fullscreen mode to complete this timed quiz assessment.",
  };
}

export default async function StudentQuizPage({ params }: PageProps) {
  const resolvedParams = await params;
  const quizId = Number(resolvedParams.id);

  return <QuizSession quizId={quizId} />;
}
