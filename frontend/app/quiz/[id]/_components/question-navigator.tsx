"use client";

import React from "react";
import { AnswerStatus } from "@/modules/quiz/types";
import { cn } from "@/lib/utils";

export interface QuestionNavState {
  selectedOptionId: number | null;
  status: AnswerStatus;
}

interface QuestionNavigatorProps {
  total: number;
  currentIndex: number;
  answerMap: Record<number, QuestionNavState>;
  questionIds: number[];
  onJump: (index: number) => void;
}

const STATUS_STYLES: Record<AnswerStatus, string> = {
  not_visited: "bg-muted text-muted-foreground border border-border",
  not_answered: "bg-rose-500 text-white border border-rose-500",
  answered: "bg-emerald-500 text-white border border-emerald-500",
  marked_for_review: "bg-violet-500 text-white border border-violet-500",
  answered_marked_for_review: "bg-amber-500 text-white border border-amber-500",
};

const LEGEND: { status: AnswerStatus; label: string }[] = [
  { status: "answered", label: "Answered" },
  { status: "not_answered", label: "Not Answered" },
  { status: "marked_for_review", label: "Marked for Review" },
  { status: "answered_marked_for_review", label: "Answered & Marked" },
  { status: "not_visited", label: "Not Visited" },
];

export default function QuestionNavigator({
  total,
  currentIndex,
  answerMap,
  questionIds,
  onJump,
}: QuestionNavigatorProps) {
  const counts = React.useMemo(() => {
    const initial: Record<AnswerStatus, number> = {
      not_visited: 0,
      not_answered: 0,
      answered: 0,
      marked_for_review: 0,
      answered_marked_for_review: 0,
    };
    for (const qId of questionIds) {
      const status = answerMap[qId]?.status ?? "not_visited";
      initial[status] += 1;
    }
    return initial;
  }, [answerMap, questionIds]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-5">
        {Array.from({ length: total }, (_, i) => i).map((index) => {
          const qId = questionIds[index];
          const status = answerMap[qId]?.status ?? "not_visited";
          return (
            <button
              key={qId ?? index}
              type="button"
              onClick={() => onJump(index)}
              className={cn(
                "h-9 w-9 rounded-md text-xs font-semibold transition-transform hover:scale-105",
                STATUS_STYLES[status],
                currentIndex === index && "ring-2 ring-offset-2 ring-primary ring-offset-background",
              )}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-2 border-t border-border pt-4 text-xs sm:grid-cols-2">
        {LEGEND.map(({ status, label }) => (
          <div key={status} className="flex items-center gap-2">
            <span className={cn("h-3 w-3 shrink-0 rounded-sm", STATUS_STYLES[status])} />
            <span className="text-muted-foreground">
              {label} ({counts[status]})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
