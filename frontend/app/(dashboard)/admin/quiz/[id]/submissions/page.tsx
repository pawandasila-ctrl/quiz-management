import React from "react";
import { cookies } from "next/headers";
import { Badge } from "@/components/ui/badge";
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
  Users,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import ReviewHeader from "@/components/review/ReviewHeader";
import { Quiz, QuizAttempt } from "@/models/quiz/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function fetchFromBackend<T>(endpoint: string): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
  const res = await fetch(`${apiUrl}${endpoint}`, {
    headers: {
      "Cookie": cookieHeader,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${res.statusText}`);
  }
  return res.json();
}

export default async function AdminQuizSubmissionsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const quizId = Number(resolvedParams.id);

  let quiz: Quiz | null = null;
  let attempts: QuizAttempt[] = [];
  let errorMsg: string | null = null;

  try {
    [quiz, attempts] = await Promise.all([
      fetchFromBackend<Quiz>(`/admin/quiz/${quizId}`),
      fetchFromBackend<QuizAttempt[]>(`/admin/quiz/${quizId}/attempts`),
    ]);
  } catch (err: any) {
    errorMsg = err.message || "Failed to load submissions";
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString();
  };

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
      <ReviewHeader
        title={`Student Submissions - ${quiz.title}`}
        subtitle="View and grade students who have completed the quiz."
        backUrl="/admin"
      />

      <Card className="border-border shadow-sm flex flex-col overflow-hidden">
        <CardContent className="p-6">
          {errorMsg ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p className="font-semibold text-sm">Failed to load attempts: {errorMsg}</p>
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
