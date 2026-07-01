"use client";

import React, { useCallback } from "react";
import { useDeleteQuestion } from "@/models/quiz/hooks";
import { Question } from "@/models/quiz/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

import ConfirmDialog from "@/components/ConfirmDialog";

interface QuestionCardProps {
  quizId: number;
  question: Question;
  index: number;
  isDraft: boolean;
}

export default function QuestionCard({
  quizId,
  question,
  index,
  isDraft,
}: QuestionCardProps) {
  const deleteQuestionMutation = useDeleteQuestion(quizId);

  const handleDelete = useCallback(() => {
    deleteQuestionMutation.mutate(question.id, {
      onSuccess: () => toast.success("Question deleted successfully."),
      onError: (err) =>
        toast.error(err.message || "Failed to delete question."),
    });
  }, [deleteQuestionMutation, question.id]);

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge
              variant="outline"
              className="text-xs uppercase border-border"
            >
              Q{index + 1}
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs font-semibold uppercase"
            >
              {question.type}
            </Badge>
            <span className="text-xs text-muted-foreground font-medium">
              {question.marks} Marks
            </span>
          </div>
          <CardTitle className="text-md font-semibold text-foreground leading-relaxed">
            {question.text}
          </CardTitle>
          {question.image_url && (
            <div className="mt-3 rounded-lg overflow-hidden border border-border h-48 w-full relative bg-muted flex justify-start">
              <Image
                src={question.image_url}
                alt="Question illustration"
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          )}
        </div>
        {isDraft && (
          <ConfirmDialog
            title="Delete Question"
            description="Are you sure you want to delete this question? This action cannot be undone."
            onConfirm={handleDelete}
            confirmText="Delete"
            variant="destructive"
            trigger={
              <Button
                variant="ghost"
                size="icon"
                disabled={deleteQuestionMutation.isPending}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-md"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
          />
        )}
      </CardHeader>
      <CardContent className="space-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
        <div className="grid gap-2">
          {question.options.map((opt) => (
            <div
              key={opt.id}
              className={`flex items-center gap-2.5 p-2 rounded-md ${
                opt.is_correct
                  ? "bg-green-50/50 border border-green-200 text-green-700 font-medium"
                  : "border border-transparent"
              }`}
            >
              {opt.is_correct ? (
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
              )}
              <span>{opt.text}</span>
            </div>
          ))}
        </div>
        {question.explanation && (
          <div className="mt-3 p-3 bg-muted/40 rounded border border-border text-xs">
            <strong className="text-foreground">Explanation:</strong>{" "}
            {question.explanation}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
