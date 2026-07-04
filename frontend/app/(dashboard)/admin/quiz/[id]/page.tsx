import React from "react";
import QuizBuilder from "@/modules/quiz/components/QuizBuilder";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Quiz Builder #${resolvedParams.id} — Admin`,
    description: "Build and edit exam papers, add MCQ or True/False questions.",
  };
}

export default async function AdminQuizBuilderPage({ params }: PageProps) {
  const resolvedParams = await params;
  const quizId = Number(resolvedParams.id);

  return <QuizBuilder quizId={quizId} />;
}
