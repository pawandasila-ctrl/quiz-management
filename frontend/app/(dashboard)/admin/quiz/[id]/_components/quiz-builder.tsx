"use client";

import React, { useState } from "react";
import { useAdminQuizDetails } from "@/models/quiz/hooks";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Plus, HelpCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import QuestionCard from "@/components/admin/quiz/QuestionCard";
import AddQuestionModal from "@/components/admin/quiz/AddQuestionModal";

interface QuizBuilderProps {
  quizId: number;
}

export default function QuizBuilder({ quizId }: QuizBuilderProps) {
  const router = useRouter();
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  // Queries
  const { data: quiz, isLoading, error } = useAdminQuizDetails(quizId);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <Card className="border-destructive bg-destructive/5 text-destructive p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6" />
          <div>
            <h3 className="font-semibold text-lg">Error Loading Quiz</h3>
            <p className="text-sm">Failed to retrieve admin quiz details.</p>
          </div>
        </div>
      </Card>
    );
  }

  const questions = quiz.questions || [];
  const isDraft = quiz.status === "draft";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin")}
          className="gap-1.5 border-border"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Panel
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-xs uppercase border-border">
                  {quiz.category?.name || "Uncategorized"}
                </Badge>
                <Badge className="capitalize">{quiz.status}</Badge>
              </div>
              <CardTitle className="text-lg font-bold text-foreground leading-tight">{quiz.title}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Created: {new Date(quiz.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground border-t border-border pt-4">
              <div className="flex justify-between">
                <span>Quiz Status</span>
                <span className="font-semibold text-foreground capitalize">{quiz.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Time Limit</span>
                <span className="font-semibold text-foreground">
                  {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} mins` : "Infinite"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pass Mark</span>
                <span className="font-semibold text-foreground">{quiz.pass_mark} Marks</span>
              </div>
              <div className="flex justify-between">
                <span>Max Attempts</span>
                <span className="font-semibold text-foreground">{quiz.max_attempts} attempts</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <span className="font-medium text-foreground">Total marks calculated</span>
                <span className="font-bold text-primary">{quiz.total_marks} Marks</span>
              </div>
            </CardContent>
            <CardFooter className="pt-4 flex flex-col gap-2 border-t border-border">
              {isDraft ? (
                <Button
                  onClick={() => setShowAddQuestion(!showAddQuestion)}
                  className="w-full font-medium gap-1.5 h-9"
                >
                  <Plus className="h-4 w-4" /> Add Question
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2 bg-muted/30 rounded border border-border w-full flex items-center justify-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Cannot add questions when quiz is published/closed.
                </p>
              )}
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {showAddQuestion && (
            <AddQuestionModal
              quizId={quizId}
              onClose={() => setShowAddQuestion(false)}
            />
          )}

          <div className="space-y-4">
            <h3 className="font-bold text-md text-foreground flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
              Questions List ({questions.length})
            </h3>

            {questions.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                No questions added to this quiz yet.
              </div>
            ) : (
              questions.map((q, idx) => (
                <QuestionCard
                  key={q.id}
                  quizId={quizId}
                  question={q}
                  index={idx}
                  isDraft={isDraft}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
