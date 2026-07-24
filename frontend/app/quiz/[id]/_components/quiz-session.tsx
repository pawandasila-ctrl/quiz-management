"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  useStudentQuizDetails,
  useActiveQuizAttempt,
  useSubmitAnswer,
  useFinalizeAttempt,
} from "@/modules/quiz/hooks";
import { useAuth } from "@/lib/auth-context";
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
  AlertTriangle,
  ShieldAlert,
  ClipboardList,
  ClipboardCheck,
  Save,
  Bookmark,
  Eraser,
  Maximize,
  MousePointerBan,
  Timer,
  Award,
  ListChecks,
  Repeat,
  LayoutGrid,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ConfirmDialog";
import ImageLightbox from "@/components/ImageLightbox";
import QuestionNavigator, { QuestionNavState } from "./question-navigator";
import { AnswerStatus } from "@/modules/quiz/types";

interface QuizSessionProps {
  quizId: number;
}

const MAX_VIOLATIONS = 3;

function computeStatus(
  selectedOptionId: number | null,
  markedForReview: boolean,
): AnswerStatus {
  if (selectedOptionId !== null && markedForReview)
    return "answered_marked_for_review";
  if (selectedOptionId !== null) return "answered";
  if (markedForReview) return "marked_for_review";
  return "not_answered";
}

function isMarkedStatus(status: AnswerStatus | undefined) {
  return (
    status === "marked_for_review" || status === "answered_marked_for_review"
  );
}

function requestFullscreen() {
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
  };
  try {
    if (el.requestFullscreen) return el.requestFullscreen().catch(() => {});
    if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
  } catch {
    // Fullscreen denied or unsupported -- proceed without it.
  }
}

function exitFullscreen() {
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void> | void;
    webkitFullscreenElement?: Element | null;
  };
  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (doc.webkitFullscreenElement && doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen();
    }
  } catch {
    // Ignore.
  }
}

function PageShell({
  children,
  center = false,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <div
      className={`min-h-screen w-full bg-muted/10 p-4 sm:p-6 lg:p-8 ${
        center ? "flex items-center justify-center" : ""
      }`}
    >
      {children}
    </div>
  );
}

export default function QuizSession({ quizId }: QuizSessionProps) {
  const router = useRouter();
  const { user, loading: isAuthLoading } = useAuth();

  const [hasConfirmedStart, setHasConfirmedStart] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answerMap, setAnswerMap] = useState<Record<number, QuestionNavState>>(
    {},
  );
  const [isSeeded, setIsSeeded] = useState(false);
  const [savingStatus, setSavingStatus] = useState<
    Record<number, "idle" | "saving" | "saved">
  >({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const violationCooldownRef = useRef(false);
  const [violationsEnabled, setViolationsEnabled] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !user) router.replace("/login");
  }, [isAuthLoading, user, router]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const { data: quiz, isLoading: isQuizLoading } =
    useStudentQuizDetails(quizId);

  const { data: attempt, isLoading: isAttemptLoading } = useActiveQuizAttempt(
    quizId,
    { enabled: hasConfirmedStart },
  );

  const submitAnswerMutation = useSubmitAnswer();

  const syncAnswer = useCallback(
    (
      questionId: number,
      selectedOptionId: number | null,
      markedForReview: boolean,
    ) => {
      if (!attempt || attempt.status !== "in_progress") return;

      setAnswerMap((prev) => ({
        ...prev,
        [questionId]: {
          selectedOptionId,
          status: computeStatus(selectedOptionId, markedForReview),
        },
      }));
      setSavingStatus((prev) => ({ ...prev, [questionId]: "saving" }));

      submitAnswerMutation.mutate(
        {
          attemptId: attempt.id,
          payload: {
            question_id: questionId,
            selected_option_id: selectedOptionId,
            marked_for_review: markedForReview,
          },
        },
        {
          onSuccess: (data) => {
            setAnswerMap((prev) => ({
              ...prev,
              [questionId]: {
                selectedOptionId: data.selected_option_id,
                status: data.status,
              },
            }));
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

  // Seed local answer state from the attempt once, on load.
  useEffect(() => {
    if (!attempt?.answers || attempt.status !== "in_progress" || isSeeded)
      return;
    const seeded: Record<number, QuestionNavState> = {};
    for (const ans of attempt.answers) {
      if ("status" in ans) {
        seeded[ans.question_id] = {
          selectedOptionId: ans.selected_option_id,
          status: ans.status,
        };
      }
    }
    const timer = setTimeout(() => {
      setAnswerMap(seeded);
      setIsSeeded(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [attempt, isSeeded]);

  const questions = useMemo(() => quiz?.questions || [], [quiz]);
  const questionIds = useMemo(() => questions.map((q) => q.id), [questions]);
  const currentQuestion = questions[currentQuestionIndex];

  // Flip a freshly-visited question from not_visited -> not_answered so the navigator reflects it.
  useEffect(() => {
    if (!isSeeded || !currentQuestion) return;
    const existing = answerMap[currentQuestion.id];
    if (existing && existing.status !== "not_visited") return;
    const timer = setTimeout(() => {
      syncAnswer(currentQuestion.id, existing?.selectedOptionId ?? null, false);
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSeeded, currentQuestion?.id]);

  const handleSelectOption = useCallback(
    (questionId: number, optionId: number) => {
      syncAnswer(
        questionId,
        optionId,
        isMarkedStatus(answerMap[questionId]?.status),
      );
    },
    [answerMap, syncAnswer],
  );

  const handleClearAnswer = useCallback(() => {
    if (!currentQuestion) return;
    syncAnswer(currentQuestion.id, null, false);
  }, [currentQuestion, syncAnswer]);

  const handleMarkForReview = useCallback(() => {
    if (!currentQuestion) return;
    const existing = answerMap[currentQuestion.id];
    syncAnswer(
      currentQuestion.id,
      existing?.selectedOptionId ?? null,
      !isMarkedStatus(existing?.status),
    );
  }, [currentQuestion, answerMap, syncAnswer]);

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleJump = useCallback((index: number) => {
    setCurrentQuestionIndex(index);
    setIsMobileNavOpen(false);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1));
  }, [questions.length]);

  const finalizeQuizMutation = useFinalizeAttempt(quizId);

  const triggerAutoSubmitRef = useRef(false);
  const handleAutoSubmit = useCallback(
    async (reason: string = "Time limit expired!") => {
      if (triggerAutoSubmitRef.current || !attempt) return;
      triggerAutoSubmitRef.current = true;
      toast.warning(`${reason} Submitting your answers automatically...`);
      try {
        await finalizeQuizMutation.mutateAsync(attempt.id);
        toast.success("Quiz submitted successfully!");
      } catch {
        toast.error("Auto-submission failed. Please contact admin.");
      }
    },
    [finalizeQuizMutation, attempt],
  );

  // Settle delay after starting to avoid immediate false-positive violation warnings
  useEffect(() => {
    if (hasConfirmedStart && attempt?.status === "in_progress") {
      const timer = setTimeout(() => {
        setViolationsEnabled(true);
      }, 1500);
      return () => {
        clearTimeout(timer);
        setViolationsEnabled(false);
      };
    }
  }, [hasConfirmedStart, attempt?.status]);

  const handleViolation = useCallback(
    (reason: string) => {
      if (
        !attempt ||
        attempt.status !== "in_progress" ||
        triggerAutoSubmitRef.current ||
        !violationsEnabled
      )
        return;

      if (violationCooldownRef.current) return;
      violationCooldownRef.current = true;
      setTimeout(() => {
        violationCooldownRef.current = false;
      }, 2000);

      console.warn("Anti-cheat violation detected:", reason);

      setViolationCount((prev) => {
        const next = prev + 1;
        if (next >= MAX_VIOLATIONS) {
          handleAutoSubmit("Too many violations detected!");
          setShowViolationModal(false);
        } else {
          setShowViolationModal(true);
        }
        return next;
      });
    },
    [attempt, handleAutoSubmit, violationsEnabled],
  );

  useEffect(() => {
    if (
      !hasConfirmedStart ||
      !attempt ||
      attempt.status !== "in_progress" ||
      !violationsEnabled
    )
      return;

    const onVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("switching tabs or minimizing the window");
      }
    };
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        handleViolation("exiting fullscreen mode");
      } else {
        setShowViolationModal(false);
      }
    };
    const onWindowBlur = () => {
      handleViolation("focusing on another window or application");
    };
    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    const onCopy = (e: ClipboardEvent) => e.preventDefault();

    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("copy", onCopy);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("blur", onWindowBlur);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("copy", onCopy);
    };
  }, [hasConfirmedStart, attempt, handleViolation, violationsEnabled]);

  useEffect(() => {
    if (attempt?.status === "graded") {
      exitFullscreen();
    }
  }, [attempt?.status]);

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

  const handleConfirmStart = useCallback(() => {
    requestFullscreen();
    setHasConfirmedStart(true);
  }, []);

  const handleReturnToFullscreen = useCallback(() => {
    setShowViolationModal(false);
    violationCooldownRef.current = true;
    setTimeout(() => {
      violationCooldownRef.current = false;
    }, 2000);
    if (typeof window !== "undefined") {
      window.focus();
    }
    requestFullscreen();
  }, []);

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

  const statusCounts = useMemo(() => {
    const counts: Record<AnswerStatus, number> = {
      not_visited: 0,
      not_answered: 0,
      answered: 0,
      marked_for_review: 0,
      answered_marked_for_review: 0,
    };
    for (const qId of questionIds) {
      counts[answerMap[qId]?.status ?? "not_visited"] += 1;
    }
    return counts;
  }, [answerMap, questionIds]);

  const answeredCount =
    statusCounts.answered + statusCounts.answered_marked_for_review;

  if (isAuthLoading || !user || isQuizLoading) {
    return (
      <PageShell center>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </PageShell>
    );
  }

  if (!quiz) {
    return (
      <PageShell center>
        <Card className="border-destructive bg-destructive/5 text-destructive p-6 max-w-md">
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
      </PageShell>
    );
  }

  if (!hasConfirmedStart) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col">
        {/* Main Content Area */}
        <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8 pb-24 animate-fade-in duration-300">
          <div className="space-y-2 border-b border-border pb-6">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-xs border-border bg-accent/25 px-2.5 py-0.5 font-medium text-muted-foreground"
              >
                Quiz Overview
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {quiz.title}
            </h1>
            {quiz.description && (
              <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
                {quiz.description}
              </p>
            )}
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                  Examination Guidelines & Security Policies
                </h3>
                <p className="text-xs text-muted-foreground">
                  Please read the following instructions carefully before
                  starting the attempt. Failure to comply may lead to automatic
                  disqualification.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex gap-4 p-4 rounded-xl border border-border bg-card">
                    <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm text-foreground mb-1">
                        Continuous Timer
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Once started, the timer runs continuously and cannot be
                        paused or stopped under any circumstances. Ensure you
                        have a stable internet connection.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 rounded-xl border border-border bg-card">
                    <Maximize className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm text-foreground mb-1">
                        Enforced Fullscreen
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        The quiz will open in fullscreen mode. Exiting
                        fullscreen mode at any time will trigger a violation
                        warning.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 rounded-xl border border-border bg-card">
                    <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm text-foreground mb-1">
                        Tab & Navigation Lock
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Do not switch browser tabs, open other applications,
                        minimize the window, or navigate away. All tab activity
                        is actively logged.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 rounded-xl border border-border bg-card">
                    <MousePointerBan className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm text-foreground mb-1">
                        Content Copying & Mouse Lock
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Right-clicking, context menus, and copying text are
                        strictly disabled to prevent academic malpractice.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-base font-bold text-foreground">
                Assessment Specifications
              </h3>

              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm divide-y divide-border">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Timer className="h-4.5 w-4.5 text-amber-500" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      Time Limit
                    </span>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {quiz.time_limit_minutes
                      ? `${quiz.time_limit_minutes} mins`
                      : "Unlimited"}
                  </span>
                </div>

                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Award className="h-4.5 w-4.5 text-blue-500" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      Total Marks
                    </span>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {quiz.total_marks} Marks
                  </span>
                </div>

                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ListChecks className="h-4.5 w-4.5 text-green-500" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      Total Questions
                    </span>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {questions.length}
                  </span>
                </div>

                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Repeat className="h-4.5 w-4.5 text-purple-500" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      Max Attempts Allowed
                    </span>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {quiz.max_attempts === 0 ? "Unlimited" : quiz.max_attempts}
                  </span>
                </div>
              </div>

              {/* Warnings Banner Card */}
              <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-2">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-400 font-semibold text-xs">
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                  Auto-Submit Threshold
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  You are permitted a maximum of{" "}
                  <strong>{MAX_VIOLATIONS} warnings</strong> for navigation
                  changes or exiting fullscreen. Upon reaching the limit, the
                  assessment terminates immediately and submits.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Actions Bar */}
        <div className="fixed bottom-0 inset-x-0 border-t border-border bg-background/80 backdrop-blur-md z-40">
          <div className="max-w-6xl w-full mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="default"
              onClick={() => router.push("/dashboard")}
              className="border-border hover:bg-accent font-medium text-xs px-4"
            >
              Back to Dashboard
            </Button>
            <Button
              size="default"
              onClick={handleConfirmStart}
              className="gap-1.5 font-semibold bg-primary hover:bg-primary/95 text-primary-foreground shadow px-6 text-xs"
            >
              <Maximize className="h-3.5 w-3.5" /> Start Quiz
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isAttemptLoading || !attempt) {
    return (
      <PageShell center>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </PageShell>
    );
  }

  if (attempt.status === "graded") {
    return (
      <PageShell center>
        <div className="w-full max-w-2xl">
          <Card className="border-border shadow-sm text-center">
            <CardHeader className="space-y-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                Answers Submitted!
              </CardTitle>
              <CardDescription>
                Your answers for <strong>{quiz.title}</strong> have been
                submitted and saved successfully.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 border border-dashed border-border rounded-xl bg-muted/20 text-center flex flex-col items-center gap-2">
                <ClipboardCheck className="h-8 w-8 text-muted-foreground/60" />
                <p className="text-sm font-semibold text-foreground">
                  Submission Received
                </p>
                <p className="text-xs text-muted-foreground max-w-sm leading-normal">
                  Thank you for taking the quiz. Your response has been
                  recorded. You can view your results from the dashboard once
                  they are released by the administrator.
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
      </PageShell>
    );
  }

  if (questions.length === 0 || !currentQuestion) {
    return (
      <PageShell center>
        <Card className="border-border text-center p-8 max-w-md">
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
      </PageShell>
    );
  }

  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const currentAnswerState = answerMap[currentQuestion.id];
  const isSaving = savingStatus[currentQuestion.id] === "saving";
  const isSaved = savingStatus[currentQuestion.id] === "saved";
  const isMarked = isMarkedStatus(currentAnswerState?.status);

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5 select-none">
        {/* Desktop Header (>= lg) */}
        <div className="hidden lg:flex sticky top-4 z-30 flex-col gap-3 rounded-xl bg-slate-900 p-4 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between dark:bg-slate-950">
          <div>
            <h2 className="font-bold text-lg">{quiz.title}</h2>
            <span className="text-xs text-slate-300">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {violationCount > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/20 px-3 py-1.5 text-sm font-semibold text-destructive-foreground">
                <MousePointerBan className="h-4 w-4" />
                Warnings: {violationCount}/{MAX_VIOLATIONS}
              </div>
            )}
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              {answeredCount}/{questions.length} Answered
            </div>
            {timeLeft !== null && (
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold">
                <Clock className="h-4 w-4 text-primary" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}
            <Button
              variant="secondary"
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

        {/* Mobile Header (< lg) - Sleek, Compact Sticky Navbar */}
        <div className="sticky top-2 z-30 flex items-center justify-between gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-white shadow-md lg:hidden dark:bg-slate-950">
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-sm truncate leading-tight">
              {quiz.title}
            </h2>
            <span className="text-[11px] text-slate-300 font-medium">
              Question {currentQuestionIndex + 1} / {questions.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {timeLeft !== null && (
              <div className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-xs font-mono font-semibold">
                <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}

            {/* Mobile Question Palette Sheet Trigger */}
            <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 px-2 text-xs bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg"
                  title="Open Question Palette"
                >
                  <LayoutGrid className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="font-mono">
                    {answeredCount}/{questions.length}
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[85%] sm:max-w-md p-0 flex flex-col h-full bg-background"
              >
                <SheetHeader className="p-4 border-b border-border bg-muted/30">
                  <SheetTitle className="text-base font-bold flex items-center gap-2">
                    <LayoutGrid className="h-4.5 w-4.5 text-primary" />
                    Question Palette
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    Tap any question number to jump directly to it.
                  </SheetDescription>
                </SheetHeader>

                <div className="p-4 flex-1 overflow-y-auto space-y-4">
                  {/* Legend and Overview Statistics */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>Answered: {answeredCount}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-300 font-medium">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" />
                      <span>Unanswered: {statusCounts.not_answered}</span>
                    </div>
                  </div>

                  <QuestionNavigator
                    total={questions.length}
                    currentIndex={currentQuestionIndex}
                    answerMap={answerMap}
                    questionIds={questionIds}
                    onJump={handleJump}
                  />
                </div>

                <div className="p-4 border-t border-border bg-card">
                  <Button
                    variant="default"
                    className="w-full font-semibold h-9"
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      setShowSubmitConfirm(true);
                    }}
                  >
                    Submit Quiz Attempt
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSubmitConfirm(true)}
              disabled={finalizeQuizMutation.isPending || isSubmittingManual}
              className="font-semibold shadow-sm h-8 px-2.5 text-xs"
            >
              Submit
            </Button>
          </div>
        </div>

        {/* Main split: question pane (100% on mobile) + navigator sidebar (desktop only) */}
        <div className="flex flex-col lg:flex-row items-start gap-5">
          <div className="flex-1 w-full min-w-0">
            <Card className="border-border shadow-sm relative overflow-hidden">
              <CardHeader className="p-4 sm:p-6 pb-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <Badge
                    variant="outline"
                    className="text-xs border-border bg-accent/10 font-semibold"
                  >
                    Question {currentQuestion.order || currentQuestionIndex + 1}
                  </Badge>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {currentQuestion.marks}{" "}
                    {currentQuestion.marks === 1 ? "Mark" : "Marks"}
                  </span>
                </div>
                <CardTitle className="text-lg sm:text-xl font-semibold tracking-tight text-foreground leading-relaxed">
                  {currentQuestion.text}
                </CardTitle>
                {currentQuestion.image_url && (
                  <ImageLightbox
                    src={currentQuestion.image_url}
                    alt="Question illustration"
                    containerClassName="mt-4 rounded-lg overflow-hidden border border-border w-full relative bg-muted flex justify-center"
                    imageClassName="object-contain"
                    thumbHeight="h-48 sm:h-64"
                  />
                )}
              </CardHeader>

              <CardContent className="space-y-3 p-4 sm:p-6 pt-4 pb-20 border-t border-border">
                {currentQuestion.options.map((opt) => {
                  const isSelected =
                    currentAnswerState?.selectedOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() =>
                        handleSelectOption(currentQuestion.id, opt.id)
                      }
                      className={`w-full text-left p-3.5 sm:p-4.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-between gap-3 min-h-12.5 ${
                        isSelected
                          ? "border-primary bg-primary/5 text-primary shadow-xs ring-1 ring-primary/30"
                          : "border-border hover:border-primary/40 hover:bg-muted/40 text-foreground"
                      }`}
                    >
                      <span className="leading-snug flex-1">{opt.text}</span>
                      <div
                        className={`h-4.5 w-4.5 shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {isSelected && (
                          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </CardContent>

              <CardFooter className="sticky bottom-0 z-20 bg-card border-t border-border p-4 sm:p-6 flex flex-col gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground self-start">
                  {isSaving && (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />{" "}
                      Saving answer...
                    </span>
                  )}
                  {isSaved && (
                    <span className="flex items-center gap-1 text-green-600">
                      <Save className="h-3 w-3" /> Answer saved
                    </span>
                  )}
                </div>

                <div className="flex w-full flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearAnswer}
                      className="flex-1 sm:flex-initial gap-1.5 text-xs border-border hover:bg-accent h-9 px-3"
                    >
                      <Eraser className="h-3.5 w-3.5" /> Clear
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkForReview}
                      className={`flex-1 sm:flex-initial gap-1.5 text-xs border-border hover:bg-accent h-9 px-3 ${
                        isMarked
                          ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800"
                          : ""
                      }`}
                    >
                      <Bookmark className="h-3.5 w-3.5" />
                      {isMarked ? "Unmark" : "Mark Review"}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentQuestionIndex === 0}
                      onClick={handlePrev}
                      className="flex-1 sm:flex-initial gap-1 text-xs border-border hover:bg-accent h-9 px-3"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" /> Previous
                    </Button>
                    {isLastQuestion ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setShowSubmitConfirm(true)}
                        disabled={
                          finalizeQuizMutation.isPending || isSubmittingManual
                        }
                        className="flex-1 sm:flex-initial text-xs font-semibold h-9 px-4"
                      >
                        Finish Quiz
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleNext}
                        className="flex-1 sm:flex-initial gap-1 text-xs font-semibold h-9 px-4"
                      >
                        Save &amp; Next <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Desktop Right Sidebar Navigator (lg+ only) */}
          <Card className="hidden lg:block lg:sticky lg:top-28 border-border shadow-sm p-4 lg:w-80 lg:shrink-0 h-fit">
            <QuestionNavigator
              total={questions.length}
              currentIndex={currentQuestionIndex}
              answerMap={answerMap}
              questionIds={questionIds}
              onJump={handleJump}
            />
          </Card>
        </div>

        <ConfirmDialog
          isOpen={showSubmitConfirm}
          onOpenChange={setShowSubmitConfirm}
          title="Submit Quiz"
          description={
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground text-left">
                Here is the summary of your quiz attempt. Please review before
                final submission.
              </p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-card">
                  <span className="h-3.5 w-3.5 shrink-0 rounded bg-emerald-500" />
                  <div className="flex-1 flex justify-between items-center min-w-0">
                    <span className="text-muted-foreground font-medium truncate text-xs">
                      Answered
                    </span>
                    <span className="font-bold text-foreground text-sm ml-2">
                      {answeredCount}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-card">
                  <span className="h-3.5 w-3.5 shrink-0 rounded bg-rose-500" />
                  <div className="flex-1 flex justify-between items-center min-w-0">
                    <span className="text-muted-foreground font-medium truncate text-xs">
                      Not Answered
                    </span>
                    <span className="font-bold text-foreground text-sm ml-2">
                      {statusCounts.not_answered}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-card">
                  <span className="h-3.5 w-3.5 shrink-0 rounded bg-violet-500" />
                  <div className="flex-1 flex justify-between items-center min-w-0">
                    <span className="text-muted-foreground font-medium truncate text-xs">
                      Marked
                    </span>
                    <span className="font-bold text-foreground text-sm ml-2">
                      {statusCounts.marked_for_review}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-card">
                  <span className="h-3.5 w-3.5 shrink-0 rounded bg-amber-500" />
                  <div className="flex-1 flex justify-between items-center min-w-0">
                    <span className="text-muted-foreground font-medium truncate text-xs">
                      Answered & Marked
                    </span>
                    <span className="font-bold text-foreground text-sm ml-2">
                      {statusCounts.answered_marked_for_review}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-card col-span-2">
                  <span className="h-3.5 w-3.5 shrink-0 rounded border border-border bg-muted" />
                  <div className="flex-1 flex justify-between items-center min-w-0">
                    <span className="text-muted-foreground font-medium truncate text-xs">
                      Not Visited
                    </span>
                    <span className="font-bold text-foreground text-sm ml-2">
                      {statusCounts.not_visited}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-900/30 p-3 text-xs text-yellow-800 dark:text-yellow-200 text-left">
                <strong>Warning:</strong> You will not be able to change your
                answers after submitting. Are you sure you want to finish the
                quiz?
              </div>
            </div>
          }
          onConfirm={handleManualSubmit}
          confirmText="Submit"
          variant="default"
          isLoading={finalizeQuizMutation.isPending || isSubmittingManual}
          loadingText="Submitting..."
        />

        {showViolationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md transition-all duration-300">
            <div className="w-full max-w-md p-6 rounded-2xl border border-destructive bg-card shadow-lg text-center animate-in fade-in zoom-in duration-300">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
                <ShieldAlert className="h-7 w-7 text-destructive" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">
                Security Violation Detected
              </h2>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                You have exited fullscreen mode or shifted focus to another
                application. To prevent academic malpractice, you must return to
                fullscreen to resume the assessment.
              </p>

              <div className="mb-6 p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-destructive-foreground/90 mb-1">
                  Violation Status
                </p>
                <p className="text-2xl font-black text-destructive">
                  Warning {violationCount} / {MAX_VIOLATIONS}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Reaching {MAX_VIOLATIONS} warnings will result in automatic
                  submission of your exam.
                </p>
              </div>

              <Button
                onClick={handleReturnToFullscreen}
                className="w-full font-semibold shadow-md bg-destructive hover:bg-destructive/95 text-destructive-foreground"
              >
                Return to Fullscreen & Resume
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
