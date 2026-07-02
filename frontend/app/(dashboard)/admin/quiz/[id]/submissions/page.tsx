"use client";

import React, { use } from "react";
import { useAdminQuizAttempts, useAdminQuizDetails } from "@/models/quiz/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminQuizSubmissionsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const quizId = Number(resolvedParams.id);
  const router = useRouter();

  const { data: quiz, isLoading: isQuizLoading } = useAdminQuizDetails(quizId);
  const { data: attempts, isLoading: isAttemptsLoading, error } = useAdminQuizAttempts(quizId);

  const isLoading = isQuizLoading || isAttemptsLoading;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
          Loading submissions...
        </p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center text-destructive">
        <AlertCircle className="h-10 w-10" />
        <p className="font-semibold">Quiz not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Back Button */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin")}
          className="gap-1.5 border border-border bg-background hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Quiz Library
        </Button>
      </div>

      <Card className="border-border shadow-sm flex flex-col overflow-hidden">
        <CardHeader className="p-6 border-b border-border/85 flex flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Users className="h-5.5 w-5.5 text-primary" />
              Student Submissions - {quiz.title}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              View and grade students who have completed the quiz.
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p className="font-semibold text-sm">Failed to load attempts.</p>
            </div>
          ) : !attempts || attempts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-muted/20 my-4">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No submissions received yet.</p>
              <p className="mt-1">Student attempts will appear here once they complete the quiz.</p>
            </div>
          ) : (
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
                            className="text-[10px] uppercase font-semibold border-border bg-accent/25"
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
                          <Link
                            href={`/admin/quiz/${quiz.id}/submissions/${att.id}`}
                            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-semibold text-foreground shadow-sm hover:bg-accent transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Review Answers
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
