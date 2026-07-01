"use client";

import React from "react";
import { useStudentQuizDetails, useQuizLeaderboard } from "@/models/quiz/hooks";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Clock, ArrowLeft, AlertCircle, Medal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface QuizLeaderboardProps {
  quizId: number;
}

export default function QuizLeaderboard({ quizId }: QuizLeaderboardProps) {
  const router = useRouter();
  const { user } = useAuth();

  // 1. Fetch Quiz Details
  const { data: quiz, isLoading: isQuizLoading } = useStudentQuizDetails(quizId);

  // 2. Fetch Leaderboard
  const { data: leaderboard, isLoading: isLeaderboardLoading, error } = useQuizLeaderboard(quizId);

  const isLoading = isQuizLoading || isLeaderboardLoading;

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
            <h3 className="font-semibold text-lg">Leaderboard Unavailable</h3>
            <p className="text-sm">
              The leaderboard for this quiz has not been released by the administrator yet.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
        </div>
      </Card>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="flex items-center justify-center h-7 w-7 rounded-full bg-yellow-100 text-yellow-600">
            <Trophy className="h-4 w-4" />
          </div>
        );
      case 2:
        return (
          <div className="flex items-center justify-center h-7 w-7 rounded-full bg-slate-100 text-slate-500">
            <Medal className="h-4 w-4" />
          </div>
        );
      case 3:
        return (
          <div className="flex items-center justify-center h-7 w-7 rounded-full bg-amber-100 text-amber-700">
            <Medal className="h-4 w-4" />
          </div>
        );
      default:
        return <span className="font-semibold text-muted-foreground text-sm pl-2">{rank}</span>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")} className="gap-1.5 border-border">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {quiz.title} - Leaderboard
          </CardTitle>
          <CardDescription>
            Performance rank of students based on their score and time taken.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!leaderboard || leaderboard.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No graded attempts recorded for this quiz yet.
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="border-b border-border">
                    <TableHead className="w-16 font-semibold">Rank</TableHead>
                    <TableHead className="font-semibold">Student</TableHead>
                    <TableHead className="text-right font-semibold">Score</TableHead>
                    <TableHead className="text-right font-semibold">Time Taken</TableHead>
                    <TableHead className="text-right font-semibold hidden md:table-cell">Submitted At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((entry) => {
                    const isCurrentUser = user?.name === entry.student_name;
                    return (
                      <TableRow
                        key={entry.rank}
                        className={`border-b border-border transition-colors ${
                          isCurrentUser
                            ? "bg-primary/5 hover:bg-primary/10 font-medium"
                            : "hover:bg-muted/40"
                        }`}
                      >
                        <TableCell className="align-middle">{getRankBadge(entry.rank)}</TableCell>
                        <TableCell className="align-middle">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 border border-border">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                {getInitials(entry.student_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-foreground text-sm">
                              {entry.student_name}
                              {isCurrentUser && (
                                <Badge variant="outline" className="ml-2 text-[10px] border-primary/20 bg-primary/5 text-primary">
                                  You
                                </Badge>
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right align-middle font-bold text-foreground">
                          {entry.score} / {entry.total_marks}
                        </TableCell>
                        <TableCell className="text-right align-middle text-muted-foreground text-sm">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground/75" />
                            {formatTime(entry.time_taken_seconds)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right align-middle text-muted-foreground text-xs hidden md:table-cell">
                          {new Date(entry.submitted_at).toLocaleDateString()} {new Date(entry.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
