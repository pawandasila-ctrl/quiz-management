import React from "react";
import { Answer } from "@/models/quiz/types";
import { HelpCircle, CheckCircle2, XCircle } from "lucide-react";

interface QuestionReviewListProps {
  answers: Answer[];
  isAdmin?: boolean;
}

export default function QuestionReviewList({
  answers,
  isAdmin = false,
}: QuestionReviewListProps) {
  if (!answers || answers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-muted/20">
        <p>No answers recorded for this attempt.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 border-b border-border/80 pb-2">
        <HelpCircle className="h-4.5 w-4.5 text-muted-foreground" />
        Question Breakdown
      </h3>

      <div className="space-y-4">
        {answers.map((ans, idx) => {
          const q = ans.question;
          if (!q) return null;
          const correctOpt = q.options?.find((o) => o.is_correct);

          return (
            <div
              key={ans.id}
              className="p-4 rounded-xl border border-border bg-card space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md shrink-0">
                  Q{idx + 1}
                </span>
                <span className="text-xs text-muted-foreground font-medium shrink-0 mt-0.5">
                  {ans.marks_awarded} / {q.marks} Marks
                </span>
              </div>

              <p className="text-sm font-semibold text-foreground">
                {q.text}
              </p>

              <div className="grid gap-2 text-xs pt-1">
                {/* Selected Option */}
                <div
                  className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                    ans.is_correct
                      ? "bg-green-50/50 border-green-200 text-green-800"
                      : "bg-red-50/50 border-red-200 text-red-800"
                  }`}
                >
                  {ans.is_correct ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                  )}
                  <span>
                    <strong>{isAdmin ? "Student's Answer:" : "Your Answer:"}</strong>{" "}
                    {ans.selected_option?.text || "No option selected"}
                  </span>
                </div>

                {/* Correct Option */}
                {!ans.is_correct && correctOpt && (
                  <div className="p-2.5 rounded-lg border border-green-150 bg-green-50/20 text-green-800 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <span>
                      <strong>Correct Answer:</strong> {correctOpt.text}
                    </span>
                  </div>
                )}
              </div>

              {/* Explanation */}
              {q.explanation && (
                <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground border border-border/60">
                  <strong className="text-foreground">Explanation:</strong> {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
