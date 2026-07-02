import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

interface ReviewScorecardProps {
  score: number;
  totalMarks: number;
  passed: boolean;
  timeTakenSeconds: number | null;
}

export default function ReviewScorecard({
  score,
  totalMarks,
  passed,
  timeTakenSeconds,
}: ReviewScorecardProps) {
  const formatTime = (seconds: number | null) => {
    if (seconds === null || seconds === undefined) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="grid grid-cols-3 gap-3 p-4 bg-muted/40 rounded-xl border border-border/80">
      <div className="flex flex-col items-center justify-center text-center p-2">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Score</span>
        <span className="text-2xl font-bold mt-1 text-foreground">
          {score}
          <span className="text-xs text-muted-foreground font-normal"> / {totalMarks}</span>
        </span>
      </div>

      <div className="flex flex-col items-center justify-center text-center p-2 border-x border-border/60">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Result</span>
        <div className="mt-1.5">
          {passed ? (
            <Badge className="bg-green-600 hover:bg-green-600 text-white gap-1 py-0.5 text-xs font-semibold">
              <CheckCircle2 className="h-3 w-3" /> Passed
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1 py-0.5 text-xs font-semibold">
              <XCircle className="h-3 w-3" /> Failed
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center text-center p-2">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Time Taken</span>
        <span className="text-sm font-semibold mt-2 flex items-center gap-1 text-foreground">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          {formatTime(timeTakenSeconds)}
        </span>
      </div>
    </div>
  );
}
