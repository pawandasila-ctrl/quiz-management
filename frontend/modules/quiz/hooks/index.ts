import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStudentQuizzesRequest,
  getStudentAttemptsRequest,
  getStudentQuizDetailsRequest,
  startQuizAttemptRequest,
  submitAnswerRequest,
  finalizeAttemptRequest,
  getQuizLeaderboardRequest,
  getAttemptResultRequest,
  SaveAnswerPayload,
} from "@/modules/quiz/actions";
import { Quiz, QuizAttempt, LeaderboardEntry, AnswerState, PaginatedResponse, QuizFilterParams } from "../types";

// ── Student Hooks ─────────────────────────────────────────────────────────────

export function useStudentQuizzes(
  params?: QuizFilterParams,
  options?: { initialData?: PaginatedResponse<Quiz> }
) {
  return useQuery<PaginatedResponse<Quiz>, Error>({
    queryKey: ["student-quizzes", params],
    queryFn: () => getStudentQuizzesRequest(params),
    initialData: options?.initialData,
  });
}

export function useStudentAttempts(options?: { initialData?: QuizAttempt[] }) {
  return useQuery<QuizAttempt[], Error>({
    queryKey: ["student-attempts"],
    queryFn: getStudentAttemptsRequest,
    initialData: options?.initialData,
  });
}

export function useActiveQuizAttempt(quizId: number, options?: { enabled?: boolean }) {
  return useQuery<QuizAttempt, Error>({
    queryKey: ["active-quiz-attempt", quizId],
    queryFn: () => startQuizAttemptRequest(quizId),
    enabled: !isNaN(quizId) && (options?.enabled ?? true),
  });
}

export function useStudentQuizDetails(quizId: number, options?: { initialData?: Quiz }) {
  return useQuery<Quiz, Error>({
    queryKey: ["student-quiz-details", quizId],
    queryFn: () => getStudentQuizDetailsRequest(quizId),
    enabled: !isNaN(quizId),
    initialData: options?.initialData,
  });
}

export function useStartQuizAttempt() {
  const queryClient = useQueryClient();
  return useMutation<QuizAttempt, Error, number>({
    mutationFn: (quizId: number) => startQuizAttemptRequest(quizId),
    onSuccess: (_, quizId) => {
      queryClient.invalidateQueries({ queryKey: ["student-attempts"] });
      queryClient.invalidateQueries({ queryKey: ["active-quiz-attempt", quizId] });
    },
  });
}

export function useSubmitAnswer() {
  return useMutation<AnswerState, Error, { attemptId: number; payload: SaveAnswerPayload }>({
    mutationFn: ({ attemptId, payload }) => submitAnswerRequest(attemptId, payload),
  });
}

export function useFinalizeAttempt(quizId: number) {
  const queryClient = useQueryClient();
  return useMutation<QuizAttempt, Error, number>({
    mutationFn: (attemptId: number) => finalizeAttemptRequest(attemptId),
    onSuccess: (data) => {
      queryClient.setQueryData(["active-quiz-attempt", quizId], data);
      queryClient.invalidateQueries({ queryKey: ["student-attempts"] });
    },
  });
}

export function useQuizLeaderboard(quizId: number, options?: { initialData?: LeaderboardEntry[] }) {
  return useQuery<LeaderboardEntry[], Error>({
    queryKey: ["quiz-leaderboard", quizId],
    queryFn: () => getQuizLeaderboardRequest(quizId),
    enabled: !isNaN(quizId),
    initialData: options?.initialData,
  });
}

export function useQuizAttemptResult(
  attemptId: number,
  options?: { enabled?: boolean },
) {
  return useQuery<QuizAttempt, Error>({
    queryKey: ["quiz-attempt-result", attemptId],
    queryFn: () => getAttemptResultRequest(attemptId),
    enabled:
      options?.enabled !== undefined
        ? options.enabled
        : !isNaN(attemptId) && attemptId > 0,
    retry: false,
  });
}
