"use client";

import React, { useState } from "react";
import { useAdminQuizAttempts } from "@/models/quiz/hooks";
import { Quiz, QuizAttempt } from "@/models/quiz/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Users,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
} from "lucide-react";
import StudentQuizResultModal from "@/models/quiz/components/student-quiz-result-modal";

interface AdminAttemptsModalProps {
  quiz: Quiz;
  onClose: () => void;
}

export default function AdminAttemptsModal({
  quiz,
  onClose,
}: AdminAttemptsModalProps) {
  const { data: attempts, isLoading, error } = useAdminQuizAttempts(quiz.id);
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(
    null
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString();
  };

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Users className="h-5.5 w-5.5 text-primary" />
              Student Submissions - {quiz.title}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">
                Loading submissions...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p className="font-semibold text-sm">Failed to load attempts.</p>
            </div>
          ) : !attempts || attempts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-muted/20 my-4">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No submissions received yet.</p>
              <p className="mt-1">Students attempts will appear here once they complete the quiz.</p>
            </div>
          ) : (
            <ScrollArea className="flex-1 -mx-2 px-2">
              <div className="border border-border/80 rounded-xl overflow-hidden bg-card">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="border-b border-border/60">
                      <TableHead className="font-semibold text-xs text-muted-foreground py-3">Student</TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground py-3">Status</TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground py-3 text-center">Score</TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground py-3 text-center">Result</TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground py-3">Submitted At</TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground py-3 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attempts.map((att) => {
                      const studentName = att.student?.name || "Unknown Student";
                      const studentEmail = att.student?.email || "-";
                      const isGraded = att.status === "graded";

                      return (
                        <TableRow
                          key={att.id}
                          className="hover:bg-muted/30 border-b border-border/60 transition-colors"
                        >
                          <TableCell className="py-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm text-foreground">
                                {studentName}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {studentEmail}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge
                              variant="outline"
                              className={`text-[10px] uppercase font-semibold border-border bg-accent/25`}
                            >
                              {att.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-center font-semibold text-sm text-foreground">
                            {isGraded ? `${att.score} / ${quiz.total_marks}` : "-"}
                          </TableCell>
                          <TableCell className="py-3 text-center">
                            {isGraded ? (
                              att.passed ? (
                                <Badge className="bg-green-600 hover:bg-green-600 text-white font-semibold text-[10px] py-0.5 gap-1 inline-flex">
                                  <CheckCircle2 className="h-3 w-3" /> Passed
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="font-semibold text-[10px] py-0.5 gap-1 inline-flex">
                                  <XCircle className="h-3 w-3" /> Failed
                                </Badge>
                              )
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-muted-foreground">
                            {formatDate(att.submitted_at || att.graded_at || att.started_at)}
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedAttempt(att)}
                              className="h-8 text-xs gap-1 border-border hover:bg-accent"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Review Answers
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="mt-4 border-t border-border pt-4 shrink-0">
            <Button onClick={onClose} className="w-full sm:w-auto h-9">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedAttempt !== null && (
        <StudentQuizResultModal
          attemptId={selectedAttempt.id}
          quiz={quiz}
          fallbackAttempt={selectedAttempt}
          isAdmin={true}
          onClose={() => setSelectedAttempt(null)}
        />
      )}
    </>
  );
}
