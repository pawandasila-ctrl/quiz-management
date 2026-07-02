"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  useStudentQuizDetails,
  useActiveQuizAttempt,
  useSubmitAnswer,
  useFinalizeAttempt,
} from "@/models/quiz/hooks";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Trophy,
  AlertTriangle,
  AlertCircle,
  ClipboardList,
  ClipboardCheck,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import ConfirmDialog from "@/components/ConfirmDialog";

interface QuizSessionProps {
  quizId: number;
}

export default function QuizSession({ quizId }: QuizSessionProps) {
  const router = useRouter();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<number, number>
  >({});
  const [savingStatus, setSavingStatus] = useState<
    Record<number, "idle" | "saving" | "saved"> & { global?: string }
  >({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const { data: quiz, isLoading: isQuizLoading } =
    useStudentQuizDetails(quizId);

  const { data: attempt, isLoading: isAttemptLoading } =
    useActiveQuizAttempt(quizId);

  useEffect(() => {
    if (attempt?.status === "in_progress" && attempt.answers) {
      const savedAnswers: Record<number, number> = {};
      attempt.answers.forEach((ans) => {
        savedAnswers[ans.question_id] = ans.selected_option_id;
      });
      const timer = setTimeout(() => {
        setSelectedOptions(savedAnswers);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [attempt]);

  const submitAnswerMutation = useSubmitAnswer();

  const handleSelectOption = useCallback(
    (questionId: number, optionId: number) => {
      if (!attempt || attempt.status !== "in_progress") return;

      setSelectedOptions((prev) => ({ ...prev, [questionId]: optionId }));
      setSavingStatus((prev) => ({ ...prev, [questionId]: "saving" }));

      submitAnswerMutation.mutate(
        {
          attemptId: attempt.id,
          payload: {
            question_id: questionId,
            selected_option_id: optionId,
          },
        },
        {
          onSuccess: () => {
            setSavingStatus((prev) => ({ ...prev, [questionId]: "saved" }));
          },
          onError: () => {
            setSavingStatus((prev) => ({ ...prev, [questionId]: "idle" }));
            toast.error("Failed to save answer. Please check your connection.");
          },
        },
      );
    },
    [attempt, submitAnswerMutation],
  );

  const finalizeQuizMutation = useFinalizeAttempt(quizId);

  const triggerAutoSubmitRef = useRef(false);
  const handleAutoSubmit = useCallback(async () => {
    if (triggerAutoSubmitRef.current || !attempt) return;
    triggerAutoSubmitRef.current = true;
    toast.warning(
      "Time limit expired! Submitting your answers automatically...",
    );
    try {
      await finalizeQuizMutation.mutateAsync(attempt.id);
      toast.success("Quiz submitted successfully!");
    } catch {
      toast.error("Auto-submission failed. Please contact admin.");
    }
  }, [finalizeQuizMutation, attempt]);

  useEffect(() => {
    if (!quiz || !attempt || attempt.status !== "in_progress") return;

    const timeLimit = quiz.time_limit_minutes;
    if (!timeLimit) return;

    const startedAt = new Date(attempt.started_at).getTime();
    const expiryTime = startedAt + timeLimit * 60 * 1000;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const remainingSeconds = Math.max(
        0,
        Math.floor((expiryTime - now) / 1000),
      );
      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 0) {
        clearInterval(interval);
        handleAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quiz, attempt, handleAutoSubmit]);

  const handleManualSubmit = useCallback(async () => {
    if (!attempt) return;
    setIsSubmittingManual(true);
    try {
      await finalizeQuizMutation.mutateAsync(attempt.id);
      toast.success("Quiz submitted successfully!");
    } catch (err: unknown) {
      let msg = "Failed to submit quiz.";
      if (err && typeof err === "object" && "message" in err) {
        msg = (err as { message: string }).message;
      }
      toast.error(msg);
    } finally {
      setIsSubmittingManual(false);
      setShowSubmitConfirm(false);
    }
  }, [attempt, finalizeQuizMutation]);

  const isLoading = isQuizLoading || isAttemptLoading;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quiz || !attempt) {
    return (
      <Card className="border-destructive bg-destructive/5 text-destructive p-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6" />
          <div>
            <h3 className="font-semibold text-lg">Error</h3>
            <p className="text-sm">
              Could not retrieve quiz session information.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (attempt.status === "graded") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-border shadow-sm text-center">
          <CardHeader className="space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              Answers Submitted!
            </CardTitle>
            <CardDescription>
              Your answers for <strong>{quiz.title}</strong> have been submitted
              and saved successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 border border-dashed border-border rounded-xl bg-muted/20 text-center flex flex-col items-center gap-2">
              <ClipboardCheck className="h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-semibold text-foreground">
                Submission Received
              </p>
              <p className="text-xs text-muted-foreground max-w-sm leading-normal">
                Thank you for taking the quiz. Your response has been recorded.
                You can view your results from the dashboard once they are
                released by the administrator.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full font-medium h-9"
            >
              Back to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const questions = quiz.questions || [];
  if (questions.length === 0) {
    return (
      <Card className="border-border text-center p-8">
        <CardContent className="space-y-3">
          <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="font-semibold text-lg text-foreground">
            No Questions Found
          </h3>
          <p className="text-sm text-muted-foreground">
            This quiz does not have any questions. Please notify the
            administrator.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isSaving = savingStatus[currentQuestion.id] === "saving";
  const isSaved = savingStatus[currentQuestion.id] === "saved";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border border-border bg-card rounded-xl shadow-sm">
        <div className="flex flex-col">
          <h2 className="font-bold text-lg text-foreground">{quiz.title}</h2>
          <span className="text-xs text-muted-foreground mt-0.5">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {timeLeft !== null && (
            <div className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg bg-accent/20 text-foreground font-semibold text-sm">
              <Clock className="h-4 w-4 text-primary" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowSubmitConfirm(true)}
            disabled={finalizeQuizMutation.isPending || isSubmittingManual}
            className="font-semibold shadow-sm h-8"
          >
            {finalizeQuizMutation.isPending || isSubmittingManual
              ? "Submitting..."
              : "Submit Quiz"}
          </Button>
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-2">
            <Badge
              variant="outline"
              className="text-xs border-border bg-accent/10"
            >
              Question {currentQuestion.order || currentQuestionIndex + 1}
            </Badge>
            <span className="text-xs font-semibold text-muted-foreground">
              {currentQuestion.marks} Marks
            </span>
          </div>
          <CardTitle className="text-lg font-semibold tracking-tight text-foreground leading-relaxed">
            {currentQuestion.text}
          </CardTitle>
          {currentQuestion.image_url && (
            <div className="mt-4 rounded-lg overflow-hidden border border-border h-64 w-full relative bg-muted flex justify-center">
              <Image
                src={currentQuestion.image_url}
                alt="Question illustration"
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-3 py-4 border-t border-b border-border my-2">
          {currentQuestion.options.map((opt) => {
            const isSelected = selectedOptions[currentQuestion.id] === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                className={`w-full text-left p-4 rounded-lg border text-sm font-medium transition-all flex items-center justify-between ${
                  isSelected
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted text-foreground"
                }`}
              >
                <span>{opt.text}</span>
                <div
                  className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                    isSelected ? "border-primary" : "border-muted-foreground/30"
                  }`}
                >
                  {isSelected && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
              </button>
            );
          })}
        </CardContent>

        <CardFooter className="pt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {isSaving && (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin text-primary" /> Saving
                answer...
              </span>
            )}
            {isSaved && (
              <span className="flex items-center gap-1 text-green-600">
                <Save className="h-3 w-3" /> Answer saved
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
              className="gap-1 text-xs border-border hover:bg-accent h-8"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </Button>
            {isLastQuestion ? (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowSubmitConfirm(true)}
                disabled={finalizeQuizMutation.isPending || isSubmittingManual}
                className="text-xs font-semibold h-8"
              >
                Finish Quiz
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                className="gap-1 text-xs border-border hover:bg-accent h-8"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <ConfirmDialog
        isOpen={showSubmitConfirm}
        onOpenChange={setShowSubmitConfirm}
        title="Submit Quiz"
        description="Are you sure you want to finish and submit your quiz? You will not be able to change your answers."
        onConfirm={handleManualSubmit}
        confirmText="Submit"
        variant="default"
        isLoading={finalizeQuizMutation.isPending || isSubmittingManual}
        loadingText="Submitting..."
      />
    </div>
  );
}
